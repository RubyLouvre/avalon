var array = [
   require('./buildIE6'),
   require('./buildIE6Test'),
    //  require('./buildIE6Sauce'),   
     
   require('./buildIE9'),
   // require('./buildIE9Test')
]
Promise.all(array).then(function() {
    console.log('build complete!!!')
}).catch(function() {
    console.log('build error!!!')
})

