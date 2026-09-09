# Wave 2 语文/英语真人核对包（F005–F007）

状态：`awaiting_human_review`。F006/F007 已有受限 candidate patch；F005 不提供自动改名。

## F005 · 语文四年级上 · 记叙文长话短说（缩句）

**来源**
- `output/chinese/outlines/义务教育教科书·语文四年级上册.json#/units/5/knowledge_points/2`
- 当前学习要求：`学习对比缩写句，提取关键动作与行为，实现表达的简洁性。`

**为什么必须真人判断**

当前标题可能把两个不同目标混在一起：
- **长话短说/概括**：面向篇章、事件或信息，删除次要内容并保留主要意思；
- **缩句**：面向单句句法，删去修饰限制成分，保留句子主干。

**核对方法**
1. 回看四年级上册“童年记忆”单元对应教材、练习或教学目标。
2. 检查材料实际要求学生做的是“概括主要内容/长话短说”，还是“句法缩句”，或两者都有。
3. 若两者都有：优先选择 `split_nodes`，分别给出名称和学习要求。
4. 若只有一个目标：选择 `rename_and_reframe` 或 `retain_single_node`，明确保留哪一侧及证据。
5. 证据不足：选择 `defer`。

**允许决定**：`split_nodes` / `rename_and_reframe` / `retain_single_node` / `defer`。

**禁止**：仅因为标题中写了“（缩句）”就认定两个目标同义；不能选择自动 `accept_candidate`。

---

## F006 · 英语四年级下 · 询问物品数量

**来源**
- `output/english/outlines/义务教育教科书·英语（三年级起点）四年级下册.json#/units/3/knowledge_points/2`
- 当前学习要求：`使用How many ... do you have?询问数量并回答`
- 原题型：`口算、填空`
- 系统候选：只删除 `口算`

**核对方法**
1. 对照该单元 At the farm 的语言任务，确认本条是英语数量问答。
2. 判断“口算”是否属于数据模板污染。
3. 若确认污染，可 `accept_candidate` 只删除“口算”。
4. 如需新增“口语交际/选择/匹配”等其他题型，必须引用实际教材/练习证据，使用 `revise_candidate`。

**允许决定**：`accept_candidate` / `revise_candidate` / `defer`。

---

## F007 · 英语六年级下 · 测量数据与尺寸的询问与表达

**来源**
- `output/english/outlines/义务教育教科书·英语（三年级起点）六年级下册.json#/units/0/knowledge_points/1`
- 原学习要求含：`metres, kilograms回。答`
- 系统候选：仅 `回。答 → 回答`

**核对方法**
1. 对照原始条目确认标点损坏位置。
2. 确认修复后仍表达 How tall / How heavy / What size 以及 metres / kilograms 的原有语义。
3. 不借本次标点修复改写单位、句型、年级要求或题型。

**允许决定**：`accept_candidate` / `revise_candidate` / `defer`。

## 提交结果

每个 case 使用 `HUMAN_REVIEW_DECISION_TEMPLATE.json` 单独填写。人工结果仍是 `unsigned_human_review`；系统接收后还需重新跑 repair recheck 和发布门禁。
