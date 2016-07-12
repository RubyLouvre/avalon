/* 
    <body>
        <div ms-controller="validate1">
            <form ms-validate="@validate">
                <p><input ms-duplex="@aaa" ms-rules='{required:@ddd}' >{{@aaa}}</p>
                <button>dddd</button>
                    
            </form>
        </div>
        <script>
var vm = avalon.define({
    $id: "validate1",
    aaa: "",
    ddd: true,
    validate: {
        onError: function (reasons) {
            reasons.forEach(function (reason) {
                console.log(reason.getMessage())
            })
        },
        onValidateAll: function (reasons) {
            if (reasons.length) {
                console.log('有表单没有通过')
            } else {
                console.log('全部通过')
            }
        }
    }
})
        </script>
    </body>
 */


