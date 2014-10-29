(function() {
	if('ondevicemotion' in window) {
		var lastXYZ = {}, // 上一次devicemotion的3个方向的加速度
			threshold = 15, // 临界值，变化量绝对值需要大于临界值 
			lastTime = Date.now() // 上一次devicemotion时间
		avalon.eventHooks.shake = {
			type: 'devicemotion',
	        deel: function(elem, fn) {
	            return function(e) {
	            	var nowXYZ = e.accelerationIncludingGravity, // 重力加速度
	            		now, // 当前时间
	            		pastTime, // 距离上次devicemotion间隔时间
	            		deltax = 0, // x轴方向加速度变化量是否大于临界值
	            		deltay = 0, // y轴
	            		deltaz = 0 // z轴
	            	if(lastXYZ.x === null && lastXYZ.y === null && lastXYZ.z === null) {
	            		lastXYZ = {
	            			x: nowXYZ.x,
	            			y: nowXYZ.y,
	            			z: nowXYZ.z
	            		}
	            		return
	            	}
	            	deltax = Math.abs(lastXYZ.x - nowXYZ.x) > threshold || 0
	            	deltay = Math.abs(lastXYZ.y - nowXYZ.y) > threshold || 0
	            	deltaz = Math.abs(lastXYZ.z - nowXYZ.z) > threshold || 0
	            	if(deltax || deltay || deltaz) {
	            		now = Date.now()
	            		pastTime = now - lastTime
	            		// 触发间隔，> 1s触发一次
	            		if(pastTime > 1000) {
	            			fn(e)
	            			lastTime = Date.now()
	            		}
	            	}
	            	lastXYZ = {
            			x: nowXYZ.x,
            			y: nowXYZ.y,
            			z: nowXYZ.z
            		}
	            }
	        }
		}
	}
}) ()