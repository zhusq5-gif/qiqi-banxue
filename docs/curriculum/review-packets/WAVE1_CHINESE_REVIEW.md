# Wave 1 语文真人核对包（F001–F004）

状态：`awaiting_human_review`。以下均未写回种子数据。

## F001 · 一年级上 · 两拼音节的拼读方法

**来源**
- `output/chinese/outlines/义务教育教科书·语文一年级上册.json#/units/2/knowledge_points/1`
- 原条目题型：`填空、口算`

**核对方法**
1. 回看来源条目及对应教材活动，确认该知识目标是拼音拼读而非计算。
2. 判断“口算”是否明显属于模板污染。
3. 若确认污染，只批准删除“口算”；若认为应补其他题型，请给出教材/练习证据，不要凭经验猜。

**允许决定**：`accept_candidate` / `revise_candidate` / `defer`。

---

## F002 · 一年级下 · ABB式词语积累

**来源**
- `output/chinese/outlines/义务教育教科书·语文一年级下册.json#/units/2/knowledge_points/2`
- 当前例词：`安安静静、叽叽喳喳`
- 系统候选标题：`AABB式词语积累`

**核对方法**
1. 分别按字位标记两个例词的结构。
2. 回看该来源位置是否还有未写入当前 learningDemand 的 ABB 例词。
3. 若本条实际只覆盖 AABB，可接受改名；若混有 ABB/AABB，应提出拆分或更准确的混合分类。

**允许决定**：`accept_candidate` / `revise_candidate` / `defer`。

---

## F003 · 二年级上 · 八字成语与动物归类

**来源**
- `output/chinese/outlines/义务教育教科书·语文二年级上册.json#/units/7/knowledge_points/2`
- 当前例词：`惊弓之鸟、胆小如鼠`
- 系统候选标题：`动物相关四字成语归类`

**核对方法**
1. 核对例词字数及是否属于成语/固定表达。
2. 回看教材原分类，确认“动物相关四字成语”是否过窄或准确。
3. 若教材本身有八字成语但本数据遗漏，应记录遗漏证据，而不是只按当前例词改名。

**允许决定**：`accept_candidate` / `revise_candidate` / `defer`。

---

## F004 · 二年级下 · ABB式与重叠形容词的语态描写

**来源**
- `output/chinese/outlines/义务教育教科书·语文二年级下册.json#/units/1/knowledge_points/2`
- 当前例词：`碧绿碧绿、葱葱绿绿`
- 系统候选标题：`ABAB式与AABB式重叠词的语态描写`

**核对方法**
1. 标注 `碧绿碧绿`、`葱葱绿绿` 分别属于何种结构。
2. 判断这是一个“重叠词综合应用”知识点，还是应拆成 ABAB 与 AABB 两个知识点。
3. 若拆分，分别给出名称、学习要求和教材证据；不要只改标题但继续混合学习目标。

**允许决定**：`accept_candidate` / `revise_candidate` / `defer`。

## 提交结果

使用同目录 `HUMAN_REVIEW_DECISION_TEMPLATE.json`，每个 F 编号单独提交一份 decision。`humanVerified` 和 `autoApply` 必须保持 `false`。
