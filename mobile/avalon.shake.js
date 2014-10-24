(function() {
	if('ondevicemotion' in window) {
		var lastXYZ = {}, threshold = 15, lastTime = Date.now()
		avalon.eventHooks.shake = {
			type: 'devicemotion',
	        deel: function(elem, fn) {
	            return function(e) {
	            	var nowXYZ = e.accelerationIncludingGravity, now
	            		, pastTime
	            		, deltax = 0
	            		, deltay = 0
	            		, deltaz = 0
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