$(function(){
    window.log('script.js exec');

    //each page can have a pageLoaded function
    if (pageLoaded != null){
        pageLoaded.apply(this,[]);
    }
});
