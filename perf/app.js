

var app = avalon.define({
    $id:'DBMonCtrl',
    databases: []
})

function loadSamples() {
  app.databases = ENV.generateData().toArray();
  Monitoring.renderRate.ping();
  setTimeout(loadSamples, ENV.timeout);
}

loadSamples()