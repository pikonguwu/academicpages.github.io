---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

[Download CV (中文)]({{ '/files/zzm-cv-cn.pdf' | relative_url }})

Education
======
* Ph.D. in Artificial Intelligence, Shanghai Jiao Tong University, 2026.09 - 2031.06 (expected)
  * School of Artificial Intelligence; Advisor: Prof. Bo Zhao
* B.Eng. in Internet of Things Engineering, Beijing University of Posts and Telecommunications, 2022.09 - 2026.06

Research Experience
======
* 2026.09 - Present: Co-first Author (with Yuqi Yang) - "Duo: Towards Spatiotemporal Action Coordination in Bimanual Policies" (Under Review)
  * Designed arm-wise state and action tokens with coupled generation through cross-arm self-attention in a shared Transformer, applicable to VLA and WAM policies.
  * Implemented and trained the model, conducted systematic evaluations and ablations, and contributed to paper writing.
  * Improved four base policies on RoboTwin 2.0: FLOWER-Duo achieves 62.70% overall success (+12.55 percentage points), and π0.5-Duo achieves 67.37% (+9.02 points). FLOWER-Duo leads the compared models in randomized generalization, precision, and memory on RoboDojo.
  * Evaluated FLOWER-Duo on real robots: 90.0% success on soft-parcel handling, 83.8% on rigid-parcel handling, and 40.0% on box packing, exceeding π0.5 on all three tasks.

* 2025.10 - 2026.04: Project Leader and First Author - "Probing Visual Planning in Image Editing Models" (NeurIPS 2026)
  * BIGAI
  * Built the Amaze benchmark to evaluate visual spatial reasoning and planning in image editing models.
  * Designed a fully automated, rule-based image-to-image evaluation pipeline.

* 2025.05 - 2025.07: Fourth Author - "TTF-VLA: Temporal Token Fusion via Pixel-Attention Integration for Vision-Language-Action Models" (AAAI 2026)
  * Peking University
  * Investigated temporal locality and validated training-free visual feature reuse and temporal feature fusion for VLA models.

* 2025.01 - 2025.05: Project Leader and Co-first Author - "MSNav: Zero-Shot Vision-and-Language Navigation with Dynamic Memory and LLM Spatial Reasoning" (ICASSP 2026)
  * Peking University
  * Contributed to dynamic topological memory and spatial reasoning, engineering experiments, method validation, and paper writing.
  * Achieved state-of-the-art zero-shot navigation performance, doubling the success rate on complex tasks.

Work experience
======
* Core Algorithm Intern, QuicRobot, 2026.03 - Present
  * Developed VLA and World Action Model (WAM) algorithms through model adaptation, training, simulation, and real-robot evaluation.
  * Integrated multi-view observations, robot states, action prediction, and control for rigid parcel flipping, flexible parcel handling, and carton folding.
  * Compared models, analyzed failures, and iterated training based on success rate, generalization, and runtime stability.

* Agent Data Evaluation Intern, ByteDance, 2025.08 - 2025.12
  * Independently designed and implemented a machine-learning-based Post-Eval framework for multi-turn agents, automating evaluation and reducing manual work.
  * Deployed the framework as a core departmental tool for continuous agent evaluation in daily production.

Publications
======
  <ul>{% for post in site.publications reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>

Awards and Honors
======
* 2025: National Encouragement Scholarship (Only recipient in major, BUPT)
* 2024: National First Prize, IC Innovation Contest (1st in track)
* 2024: Xiaomi Social Scholarship (Only recipient in major, BUPT)
* 2023, 2024: Second-Class Scholarship (Rank: 2/182, BUPT)
