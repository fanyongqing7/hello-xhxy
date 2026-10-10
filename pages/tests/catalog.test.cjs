const { test } = require('node:test');
const assert = require('node:assert/strict');
const { guideSubjects, guideResources, filterResources } = require('../assets/catalog.js');

// 首页主题与目录分离：AI 的内容不能混入 Java 主题，增加新主题无需改检索代码。
test('一级主题独立，支持新增主题及独立文档', () => {
  assert.ok(guideSubjects.some(s => s.id === 'java'));
  assert.ok(guideSubjects.some(s => s.id === 'ai'));
  assert.ok(filterResources(guideResources, guideSubjects, '', 'java').every(r => r.subjectId === 'java'));
  assert.ok(filterResources(guideResources, guideSubjects, '', 'ai').every(r => r.subjectId === 'ai'));
  const subjects = [...guideSubjects, {id:'python', name:'Python', description:'数据分析', tags:['自动化']}];
  const resources = [...guideResources, {id:'python-start', subjectId:'python', title:'入门', description:'第一课', tags:[], href:'python/'}];
  assert.deepEqual(filterResources(resources, subjects, 'Python', 'python').map(r => r.id), ['python-start']);
  assert.deepEqual(filterResources(resources, subjects, '', 'unknown'), []);
});

// 同时覆盖主题名称检索、混合大小写、全角字符、空数据和异常输入。
test('跨主题搜索与主题筛选取交集', () => {
  assert.equal(filterResources(guideResources, guideSubjects, '  ').length, guideResources.length);
  assert.deepEqual(filterResources(guideResources, guideSubjects, ' ＲＥＤＩＳ mysql ').map(r => r.id), ['database']);
  assert.deepEqual(filterResources(guideResources, guideSubjects, 'redis', 'ai'), []);
  assert.deepEqual(filterResources(guideResources, guideSubjects, '<script>alert(1)</script>'), []);
  assert.deepEqual(filterResources(guideResources, guideSubjects, '[.*'), []);
  assert.deepEqual(filterResources([], guideSubjects, 'java'), []);
  assert.ok(filterResources(guideResources, guideSubjects, '人工智能').some(r => r.subjectId === 'ai'));
});
