# Research: delay before opening social media apps

**Question:** Does adding a short delay before opening a social media app help reduce unwanted or compulsive use, and what delay is supported as optimal? Does the Zeigarnik effect explain the behavior?

**Reviewed:** 2026-10-18

## Short answer

A brief, user-chosen pause before access is a plausible and promising way to interrupt automatic app openings. The clearest directly relevant evidence is one peer-reviewed study of the self-nudge app *one sec*: its field sample used a 10-second interruption, and a randomized online experiment found that a 10-second friction condition reduced consumption of short social-media videos. The field results are encouraging but not a randomized comparison against no intervention, and the intervention bundled friction with a choice to cancel and, in some use, a prompt. The randomized component experiment found that the explicit cancel option was stronger than delay alone.

**No duration has been shown to be optimal.** The evidence supports 10 seconds as a studied starting point, not as an experimentally selected optimum: researchers did not randomize people to different delays or estimate a dose-response curve. A separate planned randomized trial describes a roughly 5-second pause, but has no reported results in the registry record. If choosing a default today, 10 seconds is the best evidence-anchored candidate; keep it brief, user-controlled, and paired with a clear choice to continue or cancel. Treat it as a behavioral aid, not a proven treatment or cure for addiction.

## What the direct evidence says

### *one sec* field study and component experiment

Grüning, Riedel, and Lorenz-Spreen report a six-week field study in which 280 voluntary users completed the observation period. The app placed a short pause before a user-selected target app; the paper describes the intervention as a 10-second delay and says users could then continue or dismiss the opening. Users dismissed 36% of attempted openings after the prompt, attempted openings declined 37% between week one and week six, and actual openings were 57% lower after six weeks. More than 80% of the monitored intervention instances involved social media apps. These are observed changes among people who chose the app and completed the study, not a randomized estimate against an untreated control: 719 new users were recruited, while people who deleted the app or ended participation early were excluded from the main six-week analysis. The authors explicitly identify self-selection and attrition as limitations. [PNAS paper](https://doi.org/10.1073/pnas.2213114120)

The same paper reports a preregistered online experiment with 500 participants randomly assigned to conditions. In the friction-only condition, a moving screen imposed 10 seconds before each of four viral social-media videos. The experiment supports a causal effect of friction in this immediate simulated-consumption task: delay-only participants skipped more videos than the message-only group, and consumed videos for less time than the message-only group. However, delay-only was not significantly different from the no-feature control on the key pairwise skip/video-time comparisons reported by the authors. The explicit option to skip had the strongest effect; the full combination of pause, generic message, and cancel option was no better than the cancel option alone. This supports adding a pause as one component, while suggesting the actionable choice may matter more. It is a video-watching experiment, not a clinical trial or a test of long-term social-media dependence. [PNAS paper](https://doi.org/10.1073/pnas.2213114120)

### Duration and the missing optimization evidence

The *one sec* paper tested one nominal duration: 10 seconds (the experimental friction screen was shown for 10 seconds, with a brief transition also noted in supplementary methods). It did not compare, for example, 3, 5, 10, or 20 seconds, nor determine the shortest pause that preserves the effect. Therefore it cannot establish 10 seconds as optimal or show that a longer delay would help more. [PNAS paper](https://doi.org/10.1073/pnas.2213114120)

As of this review date, a registered USC randomized study, *Digital Habit Interventions* (NCT07829211), plans to test an approximately five-second pause plus an intended-duration estimate and a continue prompt against usual social-media use in young adults. The record describes a planned study, not completed evidence or a result for five seconds. Its existence reinforces that the duration question remains open. [ClinicalTrials.gov record](https://clinicaltrials.gov/study/NCT07829211)

### Related interventions are not evidence for a particular opening delay

Other controlled studies test different mechanisms. A preregistered field experiment with 112 participants found that switching the phone to grayscale produced an immediate reduction in objectively measured screen time versus self-monitoring, while time-limit goal setting had a smaller, more gradual effect; it does not test a pre-opening delay. [Zimmermann & Sobolev, *Digital Strategies for Screen Time Reduction*](https://doi.org/10.1089/cyber.2022.0027)

A randomized trial of the “Not Less But Better” app compared a 20-day goal-directed planning program with a digital-detox control that asked participants to plan at least one hour of phone time-out daily. Both groups reduced reported problematic smartphone use and time spent on the phone, but the app was not superior to the active control; daily unlock counts did not change over time. Planning and self-efficacy measures were associated with later outcomes, but this trial does not establish an effective seconds-long delay. [Keller et al., *JMIR mHealth and uHealth*](https://doi.org/10.2196/26397)

These studies suggest that friction, explicit choices, goals, and planning can be useful behavioral tools, but they should not be conflated: evidence for grayscale or planning cannot identify an optimal pause duration.

## Is this the Zeigarnik effect?

“Zeigarnik effect” likely refers to the remembered tendency for interrupted or unfinished tasks to remain cognitively salient. That is not the same mechanism as interrupting an automatic app launch. The pause intervention is more directly described as friction that creates a moment for deliberation and an opportunity to cancel. No evidence in the app-delay study attributes its effects to Zeigarnik-style memory for unfinished tasks.

Also, the Zeigarnik effect is not a dependable universal rule. A 2025 meta-analysis of interrupted-task studies found no average memory advantage for unfinished over completed tasks, while it found a more consistent tendency for people to resume interrupted tasks (the related Ovsiankina effect). That literature concerns recall and resumption of tasks, not social-app access or delay design. [Ghibellini & Meier, *Humanities and Social Sciences Communications*](https://doi.org/10.1057/s41599-025-05000-w)

## Practical conclusion for product decisions

- A brief pre-open interruption is evidence-informed for reducing some automatic openings, especially when the user can easily choose **continue** or **cancel**.
- **10 seconds is a defensible initial default for a trial**, because it has direct published study support. It is not a proven optimum. The direct randomized evidence suggests the cancel choice may contribute more than time friction by itself.
- Avoid claiming the delay “breaks addiction,” treats a clinical disorder, or works for everyone. The strongest field result came from a self-selected sample without a randomized no-delay comparison; the randomized evidence used short videos rather than real-world app behavior.
- To find a product-specific optimum, compare a small set of delays (for example 5 and 10 seconds, plus no delay) in a randomized field evaluation and measure actual completed app openings, cancellations, later workarounds, and user-reported annoyance. That is a future evaluation proposal, not a published result.

## References

1. Grüning DJ, Riedel F, Lorenz-Spreen P. “Directing smartphone use through the self-nudge app one sec.” *Proceedings of the National Academy of Sciences*. 2023;120(8):e2213114120. [https://doi.org/10.1073/pnas.2213114120](https://doi.org/10.1073/pnas.2213114120)
2. Zimmermann L, Sobolev M. “Digital Strategies for Screen Time Reduction: A Randomized Field Experiment.” *Cyberpsychology, Behavior, and Social Networking*. 2023;26(1):42–49. [https://doi.org/10.1089/cyber.2022.0027](https://doi.org/10.1089/cyber.2022.0027)
3. Keller J, Roitzheim C, Radtke T, Schenkel K, Schwarzer R. “A Mobile Intervention for Self-Efficacious and Goal-Directed Smartphone Use in the General Population: Randomized Controlled Trial.” *JMIR mHealth and uHealth*. 2021;9(11):e26397. [https://doi.org/10.2196/26397](https://doi.org/10.2196/26397)
4. Ghibellini R, Meier B. “Interruption, recall and resumption: a meta-analysis of the Zeigarnik and Ovsiankina effects.” *Humanities and Social Sciences Communications*. 2025;12:962. [https://doi.org/10.1057/s41599-025-05000-w](https://doi.org/10.1057/s41599-025-05000-w)
5. University of Southern California. “Digital Habit Interventions.” ClinicalTrials.gov NCT07829211. [https://clinicaltrials.gov/study/NCT07829211](https://clinicaltrials.gov/study/NCT07829211)
