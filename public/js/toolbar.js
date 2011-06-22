/*
 Ockley 1.0
 Copyright 2011,  Matthew Page
 licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php

Manages a jQuery UI collection of buttons.
*/
function Toolbar(elemId, buttons){
    var _elemId = elemId;

    if (buttons != null){
        $.each(buttons, function(index, btn){
            if (btn.hasOwnProperty('selector') && btn.hasOwnProperty('icon') && btn.hasOwnProperty('onClick')){
                $( btn.selector ).button({
                        text: false,
                        icons: {
                            primary: btn.icon
                        }
                }).click(btn.onClick);
            }
        });
    }

}