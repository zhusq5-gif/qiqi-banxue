# Wave 2 数学 G4/G5 真人核对包

数据源：K12-KGraph `subject_specific_KG/math.json`。当前数据为 `research_only`，CC BY-NC-SA 4.0，`commercialUse=false`。

## A. G4 Exercise `math_4a_rjb_exe20`：保持未映射

**对象**：根据早餐数据绘制条形统计图  
**章节**：四上 `math_4a_rjb_ch7（条形统计图）`

**已完成的 source audit**
- Exercise 节点：`math.json L7134-L7142`
- `appears_in`：`math.json L36529-L36533`
- 已检查四上连续 `tests_*` 关系块：`math.json L65769-L66025`
- 在该块中相关记录从 `exe19` 跳到 `exe26`，未发现 `exe20` 的 `tests_concept/tests_skill`

**当前结论**：`source_unlinked_in_grade_tests_block`。本项目保持未映射，不创建 synthetic raw edge。

**真人核对方法**
1. 如有条件，再查看实际教材/题目上下文，确认本题主要测评目标。
2. 如果没有新的 raw 数据证据：选择 `keep_unmapped`。
3. 若怀疑数据源遗漏但无法证明：选择 `needs_source_evidence`。
4. 若教研明确认为应映射到“条形统计图/每格表示数量/选择合适统计方式”等知识，只能选择 `propose_curated_mapping`，并写明教材页码/题目证据；该提案属于本系统 curated layer，不得标成 K12-KGraph raw edge。

**禁止**：因为题目名称中出现“条形统计图”就直接补 `tests_concept`。

---

## B. G5 折线统计图 → G4 条形统计图：raw `relates_to`

**raw edge**：`fine-v3-e67`  
**关系**：G5 `折线统计图` → G4 `条形统计图`  
**原类型**：`relates_to`  
**evidence**：条形图突出数量大小，折线图突出变化趋势。

**真人核对方法**
1. 先确认 raw relation 与 evidence 一致，不改写原始类型。
2. 判断课程层是否只需要保留“相关/比较”，还是有充分教学证据提出新的 prerequisite/progression 候选。
3. 如果没有额外教学证据，优先 `keep_raw_relation_only`。
4. 如果提出课程关系，选择 `propose_curriculum_relation`，必须说明新关系类型和依据；后续另走 Curriculum relation 审核，不修改 raw edge。

**允许决定**：`keep_raw_relation_only` / `propose_curriculum_relation` / `reject_curriculum_use` / `defer`。

---

## C. G2“角”在 G4“角的度量”中的复用

**KnowledgeNode**：`math:kg:math_2a_rjb_cpt9`（角）  
**G4 Occurrence**：raw `appears_in` 将该低年级概念定位到四上“角的度量”。

**真人核对方法**
1. 判断二年级与四年级使用的“角”是否仍是同一概念身份。
2. 比较两个年级的学习要求：二年级偏初步认识；四年级进入角度、量角器和度量。
3. 若概念身份一致，选择 `keep_same_identity`，并建议在 G4 Occurrence 上补充更高层次学习要求，而不是复制 KnowledgeNode。
4. 若有明确证据说明概念需要拆成不同身份，选择 `split_identity_candidate` 并写出边界。

**允许决定**：`keep_same_identity` / `split_identity_candidate` / `defer`。

---

## D. 其他 G4/G5 audit case

完整 case 列表以系统 `/knowledge-map/human-review` 和 `src/content/curriculum/humanReview.ts` 动态生成结果为准。所有 cross-grade relation 和 occurrence reuse 均遵循：

- raw edge 类型不改写；
- `research_sequence` 不等于 prerequisite；
- source evidence 与课程层教研判断分开；
- 所有人工结果先是 `unsigned_human_review`。

## 提交结果

使用 `HUMAN_REVIEW_DECISION_TEMPLATE.json`。每个 case 单独填写；必须写审核人的数学教研角色、实际查看过的 sourceLocator/教材证据以及决策理由。
