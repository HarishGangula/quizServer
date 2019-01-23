
angular.module('playerApp', ['ngSanitize'])
  .controller('playerAppController', function($interval, $timeout, $scope) {
    
    
    socket.on('question', function(data){
        console.log(data)
        player.optionsLoader = false;
        player.options = _.get(JSON.parse(_.get(data, 'data.body')), 'data.data.options');
        console.log(player.options)
       // 'https://dev.ekstep.in'
    })






    //qrcode

  })


  //