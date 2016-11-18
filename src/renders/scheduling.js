import { avalon } from '../seed/core'

var rendering = null
var tasks = []
/**
 * 任务调度系统，用不着数据变动后立即更新变图
 */
export function scheduling(job) {
    if (rendering) {
        avalon.Array.ensure(tasks, job)
    } else {
        tasks.push(job)
        rendering = true
        setTimeout(function () {
            var list = tasks.splice(0, tasks.length)
            list.sort(function (a, b) {
                return a.priority - b.priority
            }).forEach(function (el) {
                el.update()
            })
            rendering = false
        })
    }
}