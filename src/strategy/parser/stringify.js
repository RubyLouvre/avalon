var keyMap = avalon.oneObject("break,case,catch,continue,debugger,default,delete,do,else,false," +
        "finally,for,function,if,in,instanceof,new,null,return,switch,this," +
        "throw,true,try,typeof,var,void,while,with," + /* 关键字*/
        "abstract,boolean,byte,char,class,const,double,enum,export,extends," +
        "final,float,goto,implements,import,int,interface,long,native," +
        "package,private,protected,public,short,static,super,synchronized," +
        "throws,transient,volatile")
avalon.keyMap = keyMap
  var quoted = {
      type: 1,
      template: 1,
      innerHTML: 1,
      outerHTML: 1,
      order: 1,
      nodeValue: 1,
      dynamic: 1,
      signature: 1,
      wid: 1,
      cid: 1
  }

var rneedQuote = /[W-]/
var quote = avalon.quote
function fixKey(k) {
    return (rneedQuote.test(k) || keyMap[k]) ? quote(k) : k
}

function stringify(obj) {
    var arr1 = []
//字符不用东西包起来就变成变量
    for (var i in obj) {
        if (i === 'props') {
            var arr2 = []
            for (var k in obj.props) {
                var kv = obj.props[k]
                if (typeof kv === 'string') {
                    kv = quote(kv)
                }
                arr2.push(fixKey(k) + ': ' + kv)
            }
            arr1.push('props: {' + arr2.join(',\n') + '}')
        } else if(obj.hasOwnProperty(i) && i !== 'dom') {
           
            var v = obj[i]
            if (typeof v === 'string') {
                v = quoted[i] ? quote(v) : v
            }
            arr1.push(fixKey(i) + ':' + v)
        }
    }
    return '{\n' + arr1.join(',\n') + '}'
}

module.exports = stringify
