'use strict';

const db = uniCloud.database()

// 处理过期课时包
async function checkAndUpdateExpiredPackages(db) {
  try {
    const now = new Date()
    
    // 查找过期的课时包
    const expiredPackages = await db.collection('hours_packages')
      .where({
        status: 'active',
        is_unlimited: false,
        expire_at: db.command.lt(now)
      })
      .get()
    
    if (!expiredPackages.data || expiredPackages.data.length === 0) {
      console.log('没有过期的课时包需要处理')
      return { processed: 0 }
    }
    
    let processedCount = 0
    
    for (const pkg of expiredPackages.data) {
      try {
        // 跳过已处理的课时包
        if (pkg.status === 'expired' || pkg.expire_processed === true) {
          continue
        }
        
        // 先检查学生是否存在
        const studentRes = await db.collection('students').doc(pkg.student_id).get()
        let student = null
        if (studentRes.data) {
          if (Array.isArray(studentRes.data)) {
            student = studentRes.data.length > 0 ? studentRes.data[0] : null
          } else {
            student = studentRes.data
          }
        }
        
        if (!student) {
          console.warn(`学生不存在: ${pkg.student_id}, 跳过处理`)
          // 即使学生不存在，也要将课时包标记为已处理
          await db.collection('hours_packages').doc(pkg._id).update({
            status: 'expired',
            expire_processed: true,
            update_time: now
          })
          continue
        }
        
        // 开始事务
        const transaction = await db.startTransaction()
        let transactionRolledBack = false
        
        try {
          // 事务内查询最新状态
          const latestPkgRes = await transaction.collection('hours_packages').doc(pkg._id).get()
          let latestPkg = null
          if (latestPkgRes.data) {
            if (Array.isArray(latestPkgRes.data)) {
              latestPkg = latestPkgRes.data.length > 0 ? latestPkgRes.data[0] : null
            } else {
              latestPkg = latestPkgRes.data
            }
          }
          
          if (!latestPkg || latestPkg.status === 'expired' || latestPkg.expire_processed === true) {
            await transaction.commit()
            continue
          }
          
          // 计算扣减的课时
          const expireDeduct = latestPkg.remaining || 0
          const newUsed = (latestPkg.used || 0) + expireDeduct
          
          // 计算学生的新课时数
          const beforeHours = student.remaining_hours || 0
          const afterHours = Math.max(0, beforeHours - expireDeduct)
          const beforeUsedHours = student.used_hours || 0
          const afterUsedHours = beforeUsedHours + expireDeduct
          
          // 更新课时包状态
          await transaction.collection('hours_packages').doc(latestPkg._id).update({
            status: 'expired',
            remaining: 0,
            used: newUsed,
            expire_processed: true,
            update_time: now
          })
          
          // 更新学生课时信息
          await transaction.collection('students').doc(latestPkg.student_id).update({
            total_hours: afterHours,
            remaining_hours: afterHours,
            used_hours: afterUsedHours,
            update_time: now
          })
          
          // 添加扣减记录
          await transaction.collection('class_records').add({
            student_id: latestPkg.student_id,
            hours: expireDeduct,
            days: 0,
            unit: 'lesson',
            type: 'expire',
            reason: '课时包过期自动扣减',
            before_hours: beforeHours,
            after_hours: afterHours,
            before_days: student.remaining_days || 0,
            after_days: student.remaining_days || 0,
            package_id: latestPkg._id,
            operator_id: 'system',
            create_time: now
          })
          
          // 提交事务
          await transaction.commit()
          console.log(`成功处理过期课时包: ${latestPkg._id}`)
          processedCount++
          
        } catch (e) {
          // 回滚事务
          if (!transactionRolledBack) {
            try {
              await transaction.rollback()
            } catch (rollbackError) {
              console.warn(`事务回滚失败:`, rollbackError)
            }
            transactionRolledBack = true
          }
          console.error(`处理课时包失败: ${pkg._id}`, e)
        }
        
      } catch (e) {
        console.error(`处理课时包异常: ${pkg._id}`, e)
      }
    }
    
    return { processed: processedCount }
    
  } catch (e) {
    console.error('处理过期课时包失败:', e)
    throw e
  }
}

exports.main = async (event, context) => {
  try {
    console.log('开始处理过期课时包')
    const result = await checkAndUpdateExpiredPackages(db)
    console.log(`处理完成，共处理 ${result.processed} 个过期课时包`)
    
    return {
      code: 0,
      message: '处理成功',
      data: result
    }
  } catch (e) {
    console.error('定时任务执行失败:', e)
    return {
      code: -1,
      message: '处理失败',
      error: e.message
    }
  }
}