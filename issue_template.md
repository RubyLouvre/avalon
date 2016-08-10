<!--
Thank you for contributing! Please carefully read the following before opening your issue.

中文用户：请尽量用英文描述你的 issue，这样能够让尽可能多的人帮到你。

如何提问
===============
请在提问前详细阅读下面内部

- 没有看过官网先看一遍官网: http://avalonjs.coding.me/
- 没有看过教程先看一遍教程: https://segmentfault.com/u/situzhengmei/articles
- 到论坛用关键查一下有没有人遇到与你相同的问题: http://www.avalon.org.cn/
- 到**segementFault**搜索: https://segmentfault.com/search?q=avalon
- 检查一下已关掉的issue有没有与你相同的问题: https://github.com/RubyLouvre/avalon/issues?q=is%3Aissue+is%3Aclosed


为了提高avalon的影响力,如果确定不是BUG,是你一些疑问与业务难题,请到**segementFault**上发贴子

当然有你有什么分享或avalon组件也建议直接在**segementFault**上发贴子


如果你确定是BUG,请按以下格式提问
================
- 在什么浏览器下,IE6,IE7,chrome51?

- 在avalon什么版本下? 你如果打开avalon源码,将最开头的那段注释贴上来!

- 提供一个可以运行的例子,比如像这人

https://github.com/RubyLouvre/avalon/issues/1665

```
组件监听无法触发
built in 2016-8-4:19 version 2.110 by 司徒正美 谷歌浏览器

    <body ms-controller="test">
        <xmp ms-widget="{is:'ms-div',$id:'123',Sesshoumaru:@Sesshoumaru}"></xmp>
        <button ms-click="@click">123</button>
        <script>
            avalon.component('ms-div', {
                template: '<div></div>',
                defaults: {
                    Sesshoumaru: '',
                    onInit: function() {
                        this.$watch('Sesshoumaru', function() {
                            console.log('Inuyasha love Sesshoumaru') //此处无法触发
                        });
                    }
                }
            })

            var vm = avalon.define({
                $id: 'test',
                Sesshoumaru: '',
                click: function() {
                    this.Sesshoumaru = 567;
                },
            });
        </script>
    </body>

```

- 想快点得到解决,请提供具体的操作步骤

- 想快点得到解决, 最好将控制如的错误信息也截图贴上来!
