---
title: "Duo: Towards Spatiotemporal Action Coordination in Bimanual Policies"
collection: publications
category: under_review
permalink: /publication/duo-vla-bimanual-coordination
excerpt: 'Arm-wise state and action tokens with coupled generation in a shared Transformer, improving bimanual VLA and WAM policies.'
date: 2026-09-01
venue: 'Under Review'
citation: 'Zhimu Zhou*, Yuqi Yang*, Yixin Lin, Junsen Zhang, Jian Zhao, Jiayu Zhong, Jiaxun Sun, Bingxin Wang, Binhua Zuo, Bo Zhao. (2026). &quot;Duo: Towards Spatiotemporal Action Coordination in Bimanual Policies.&quot; Under review. (*Equal contribution; co-first authors)'
---

Duo assigns each arm separate state and action tokens, then jointly generates both arms' action chunks through cross-arm self-attention in one shared Transformer. The design applies to both vision-language-action (VLA) and world-action model (WAM) policies.

On RoboTwin 2.0, Duo improves overall success across four base policies spanning 0.45B to 3.62B parameters: SmolVLA, Lila-WAM, FLOWER, and π0.5. FLOWER-Duo reaches **62.70%** overall success (**+12.55 percentage points** over FLOWER), while π0.5-Duo reaches **67.37%** (**+9.02 points** over π0.5).

On RoboDojo, FLOWER-Duo achieves the highest randomized-generalization, precision, and memory scores among the compared methods, and ranks second in overall score and success rate. On real robots, it achieves **90.0%** success on soft-parcel handling, **83.8%** on rigid-parcel handling, and **40.0%** on box packing, exceeding π0.5 on all three tasks.

Ablations examine coupled generation, action grouping, and token granularity. Per-dimension tokenization improves overall success by only 0.78 percentage points over Duo while requiring **6.12× the action-head computation per action chunk**.

**Status:** Under review; research ongoing since September 2026.

**Personal contribution:** Co-first author with Yuqi Yang; model implementation, training, systematic evaluation, ablations on action grouping, cross-arm interaction and cross-model transfer, and paper writing.
