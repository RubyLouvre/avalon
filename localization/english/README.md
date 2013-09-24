合并步骤
========

1. 安装KDiff3 （ http://kdiff3.sourceforge.net/ ）等3-way合并工具
2. 在国际版的最新提交信息中获取该版本所依据的原始版本提交号，check out该提交，取原版文件另存为avalon_base.js
3. check out最新的提交，取国际版文件另存为avalon_old.js; 取最新原版文件另存为avalon_new.js
4. 打开KDiff3，取avalon.base.js作为File A （base），avalon_old.js作为File B， avalon_new.js作为File C。勾选Merge选项，输出文件设为avalon.js
5. KDiff会自动合并大部分改动，少数冲突部分可人手调整。
6. 新版如果新增了包含中文的行（也就是在base中不存在该行），KDiff会认为是非冲突修改自动合并。因此在修复冲突后还需要检查一遍非冲突改动部分，翻译新增的中文。
7. 保存合并后的avalon.js文件，覆盖原国际版文件。
8. 提交时应在提交信息中记录本次国际版所依据的原始版本提交号，便于下次合并。
