# Chapter 3: Research Methodology

## 3.1 Introduction

This chapter presents the methodological framework employed to investigate how human–AI collaboration can be effectively designed within a digital mental health system that delivers Emotional Freedom Techniques (EFT) for anxiety management. The research adopts a pragmatist epistemological stance, prioritising practical outcomes and problem-solving over adherence to a single methodological paradigm (Creswell & Plano Clark, 2017). This philosophical position aligns with the applied nature of the research, which seeks to develop and evaluate a functional digital intervention rather than test abstract theoretical propositions.

The study employs a Design Science Research (DSR) methodology (Hevner et al., 2004) combined with mixed-methods data collection and analysis. DSR is particularly suited to this investigation as it emphasises the creation and evaluation of innovative artefacts—in this case, an AI-driven EFT delivery system called "Tapaway"—while simultaneously generating prescriptive knowledge about effective design principles (Peffers et al., 2007). The mixed-methods component enables triangulation between quantitative outcome metrics and qualitative conversational data, addressing the multifaceted nature of therapeutic interaction.

This methodological approach responds directly to gaps identified in the literature review. While existing research has established the efficacy of EFT for anxiety reduction (Clond, 2016; Bach et al., 2019) and explored AI applications in mental health (Abd-Alrazaq et al., 2019; Manole et al., 2024), limited empirical work has examined the intersection of these domains. Furthermore, the literature reveals a need for research that moves beyond simple chatbot interactions toward more sophisticated human–AI collaborative frameworks that preserve therapeutic fidelity while enabling personalisation (Klos et al., 2021).

## 3.2 Research Design

### 3.2.1 Research Questions

The primary research question guiding this investigation is:

> **How can human–AI collaboration be effectively designed within a digital mental health system that delivers Emotional Freedom Techniques (EFT) for anxiety management?**

This overarching question is operationalised through four subsidiary research questions:

**RQ1:** What design principles enable effective human–AI collaboration in EFT-based anxiety interventions?

**RQ2:** How can AI-driven personalisation enhance the delivery of EFT while maintaining protocol fidelity?

**RQ3:** How does adaptive AI guidance impact users' capacity to identify and articulate anxiety-related concerns?

**RQ4:** What patterns in user–AI interaction data correlate with successful anxiety reduction outcomes?

### 3.2.2 Research Design Matrix

Table 3.1 presents the alignment between research questions, methodological approaches, data sources, and analytical techniques.

| Research Question | Primary Method | Data Sources | Analysis Approach |
|-------------------|----------------|--------------|-------------------|
| RQ1: Design Principles | Design Science Research | System architecture, interaction logs, design decisions | Artefact evaluation, pattern extraction |
| RQ2: AI Personalisation | Experimental (within-subjects) | Session data, setup statements, conversation transcripts | Correlation analysis, content analysis |
| RQ3: Adaptive Guidance | Mixed-Methods | Pre/post intensity ratings, conversational sequences | Thematic analysis, turn-taking analysis |
| RQ4: Interaction Patterns | Quantitative Data Mining | Full interaction dataset, outcome metrics | Clustering, regression modelling, sequence analysis |

*Table 3.1: Research Design Matrix*

### 3.2.3 Justification for Design Science Research

Design Science Research was selected as the primary methodological framework for several reasons. First, DSR explicitly addresses the development of innovative artefacts intended to solve identified problems (Hevner et al., 2004), which aligns precisely with the goal of creating an effective AI-driven EFT delivery system. Second, DSR generates both practical outcomes (a working system) and theoretical contributions (design principles), satisfying the dual requirements of professional practice and academic inquiry (Gregor & Hevner, 2013). Third, DSR accommodates iterative development and evaluation cycles, enabling refinement of the artefact based on empirical findings.

The Tapaway system functions simultaneously as the research intervention and the research instrument. This dual role is characteristic of DSR, where the artefact embodies theoretical propositions while generating data for their evaluation (Peffers et al., 2007). The system's architecture—including its state machine, AI prompts, and data collection mechanisms—represents instantiated design knowledge that can be extracted, articulated, and transferred to future design efforts.

## 3.3 The Research Artefact: Tapaway System Architecture

### 3.3.1 Overview

Tapaway is a web-based application designed to deliver EFT interventions for anxiety management through human–AI collaboration. The system guides users through a structured therapeutic journey while adapting to individual needs through AI-driven personalisation. Built using React, TypeScript, and Supabase for the frontend and database, with OpenAI's GPT-4o-mini powering conversational interactions, the system represents a novel integration of established therapeutic protocols with contemporary AI capabilities.

### 3.3.2 State Machine as Research Framework

The therapeutic journey is structured as a finite state machine comprising ten discrete states, each representing a phase of the EFT intervention. This architectural choice serves both therapeutic and research purposes: therapeutically, it ensures protocol fidelity by enforcing the correct sequence of EFT components; methodologically, it enables precise measurement of user progression, dropout points, and state-specific behaviours.

The ten states are:

1. **Initial**: User presents their concern in open-ended format
2. **Conversation**: AI gathers problem, emotion, and body location through natural dialogue
3. **Gathering-Intensity**: User provides initial SUDS rating (0-10)
4. **Setup-Statements**: AI generates personalised EFT affirmations
5. **Tapping**: Guided tapping sequence through meridian points
6. **Post-Tapping**: User provides post-round SUDS rating
7. **Decision**: System determines next action based on intensity change
8. **New-Round**: Preparation for additional tapping round
9. **Advice**: AI generates personalised coping strategies
10. **Complete**: Session conclusion with outcome summary

This state machine architecture enables granular data collection at each transition point, supporting both process and outcome analysis. The explicit state boundaries create natural measurement points while the transition logic encodes therapeutic decision rules derived from clinical EFT protocols.

### 3.3.3 Three-Tier Data Collection Architecture

The system implements a three-tier data collection framework designed to capture the full spectrum of therapeutic interaction:

**Tier 1: Session Context (Real-Time)**
The frontend maintains a dynamic session context object updated throughout the interaction. This includes the user's stated problem, identified emotion, body location of sensation, and current intensity rating. The session context enables real-time personalisation while providing a structured record of therapeutic content.

**Tier 2: Conversational Data**
All user–AI exchanges are captured as timestamped message objects with role attribution (user or assistant), content, and metadata including the current state at time of message generation. This comprehensive conversational record supports qualitative analysis of interaction patterns, linguistic features, and therapeutic alliance indicators.

**Tier 3: Outcome Metrics (Database)**
Structured outcome data is persisted to the Supabase database, including:
- Initial and final intensity ratings
- Number of tapping rounds completed
- Session duration and timestamps
- AI-generated setup statements and advice
- Crisis detection flags
- Demographic variables (age group, industry)

### 3.3.4 AI Architecture: Bounded Generative Framework

The AI component employs what may be termed a "Bounded Generative Framework"—a design approach that harnesses the creative capabilities of large language models while constraining outputs within therapeutically appropriate boundaries. This is achieved through several mechanisms:

**Prompt Engineering**: System prompts define the AI's role, communication style, and therapeutic objectives. Extensive prompt engineering ensures the AI maintains warmth, validates user experiences, and follows EFT protocols while adapting language to individual users.

**Input Classification**: A preprocessing layer classifies user inputs for relevance before main processing. This prevents the AI from engaging with off-topic content, potential jailbreak attempts, or inputs that could derail the therapeutic process.

**Tool Calling for Structured Outputs**: When structured data is required (e.g., setup statement generation), the system uses OpenAI's function calling feature to guarantee valid JSON output conforming to predefined schemas. This eliminates parsing failures and ensures consistency.

**State-Specific Constraints**: Each state has tailored prompts and response parameters. The AI's behaviour is contextualised to the current therapeutic phase, preventing inappropriate responses.

This bounded approach addresses concerns raised in the literature regarding AI unpredictability in mental health contexts (Klos et al., 2021) while preserving the natural language capabilities that enable therapeutic rapport.

## 3.4 Data Collection Methods

### 3.4.1 Quantitative Data

#### 3.4.1.1 Subjective Units of Distress Scale (SUDS)

The primary outcome measure is the Subjective Units of Distress Scale (SUDS), a self-report measure of emotional intensity on a 0-10 scale where 0 represents no distress and 10 represents maximum distress (Wolpe, 1969). SUDS ratings are collected at two points within each tapping session: immediately before the first tapping round (initial intensity) and after each round (post-round intensity). This within-session repeated measures design enables calculation of improvement percentages and assessment of dose-response relationships.

SUDS was selected for several reasons. First, it is the standard outcome measure in EFT research, enabling comparison with existing literature (Church, 2013; Clond, 2016). Second, its simplicity supports integration into the conversational flow without disrupting therapeutic engagement. Third, despite its subjective nature, SUDS demonstrates acceptable reliability and validity when used in anxiety contexts (Tanner, 2012).

#### 3.4.1.2 Patient Health Questionnaire-9 (PHQ-9)

The Patient Health Questionnaire-9 (PHQ-9) is administered as part of the initial assessment process. The PHQ-9 is a validated nine-item instrument assessing depression severity over the preceding two weeks (Kroenke et al., 2001). Each item is scored 0-3, yielding total scores ranging from 0-27 with established severity thresholds: minimal (0-4), mild (5-9), moderate (10-14), moderately severe (15-19), and severe (20-27).

The PHQ-9 serves multiple purposes in this research. First, it provides a standardised baseline measure of psychological distress enabling sample characterisation. Second, item 9 ("Thoughts that you would be better off dead or of hurting yourself") functions as a suicide risk screening mechanism, triggering crisis support resources when endorsed. Third, PHQ-9 scores enable exploration of whether baseline severity moderates intervention effectiveness.

#### 3.4.1.3 Session Metrics

Additional quantitative metrics automatically captured include:
- **Rounds completed**: Number of tapping sequences within a session
- **Session duration**: Time from session initiation to completion
- **Message count**: Number of conversational turns
- **Improvement percentage**: Calculated as ((initial - final) / initial) × 100
- **Dropout indicators**: Sessions initiated but not completed

### 3.4.2 Qualitative Data

#### 3.4.2.1 Conversational Transcripts

The complete user–AI dialogue is captured and stored, providing a rich qualitative dataset for analysis. These transcripts contain:
- User descriptions of anxiety-provoking situations
- Emotional vocabulary employed by users
- Body awareness descriptions
- Responses to AI prompts and guidance
- Natural language expressions of distress change

#### 3.4.2.2 Problem Descriptions

User-generated problem statements represent unstructured qualitative data amenable to thematic analysis. These descriptions reveal the types of concerns users bring to the intervention, the language they use to articulate distress, and the specificity with which they can identify anxiety sources.

#### 3.4.2.3 AI-Generated Content

The setup statements and advice generated by the AI constitute a secondary qualitative dataset. Analysis of this content enables evaluation of personalisation effectiveness, grammatical and contextual appropriateness, and adherence to EFT protocols.

## 3.5 Sampling Strategy and Participants

### 3.5.1 Target Population

The target population comprises adults experiencing self-reported anxiety who are willing to engage with a digital mental health intervention. The study does not require a clinical diagnosis, aligning with EFT's established use as a self-help technique for subclinical anxiety management (Church et al., 2012).

### 3.5.2 Sampling Approach

A convenience sampling strategy is employed, recruiting participants through university networks and digital channels. While convenience sampling limits generalisability, it is appropriate for this exploratory research phase focused on artefact evaluation and design principle extraction rather than population-level inference (Etikan et al., 2016).

### 3.5.3 Inclusion and Exclusion Criteria

**Inclusion Criteria:**
- Age 18 years or older
- Self-reported experience of anxiety (occasional or frequent)
- Ability to read and write in English
- Access to a device with internet connectivity

**Exclusion Criteria:**
- Currently experiencing acute psychiatric crisis
- Active suicidal ideation (screened via PHQ-9 item 9)
- Diagnosis of severe mental illness (e.g., psychosis, bipolar disorder with active episodes)
- Currently receiving inpatient psychiatric treatment

These criteria balance the ethical imperative to protect vulnerable individuals with the research goal of evaluating the intervention across a range of anxiety presentations. Users endorsing crisis indicators are provided immediate access to professional support resources and excluded from analysis.

### 3.5.4 Sample Size Considerations

Sample size determination for this research is guided by pragmatic considerations and the exploratory nature of the study. The meta-analysis by Clond (2016) reported large effect sizes (d = 1.23) for EFT interventions on anxiety, suggesting that meaningful effects may be detectable with relatively modest samples. For the quantitative analyses, a minimum of 30 completed sessions is targeted to enable basic inferential statistics while recognising that larger samples would provide greater statistical power for subgroup analyses.

For qualitative analysis, data collection continues until thematic saturation is approached—the point at which additional data yields diminishing new insights (Braun & Clarke, 2006). Given the structured nature of the intervention, saturation in terms of interaction patterns is anticipated after approximately 50-100 sessions.

## 3.6 Data Analysis Procedures

### 3.6.1 Quantitative Analysis

#### 3.6.1.1 Descriptive Statistics

Initial analysis involves descriptive characterisation of the sample and outcome distributions:
- Means, standard deviations, and ranges for SUDS ratings (initial and final)
- Frequency distributions for categorical variables (severity levels, demographic groups)
- Session-level metrics (rounds completed, duration, dropout rates)
- Improvement percentages across sessions

#### 3.6.1.2 Inferential Statistics

Paired-samples t-tests assess whether post-intervention SUDS ratings significantly differ from pre-intervention ratings, testing the basic effectiveness hypothesis. Effect sizes (Cohen's d) contextualise the magnitude of observed changes relative to existing literature.

#### 3.6.1.3 Correlation Analysis

Correlation analysis explores relationships between personalisation variables and outcomes. Specifically:
- Correlation between number of rounds completed and improvement percentage
- Relationship between initial intensity and absolute improvement
- Association between conversational engagement (message count) and outcomes
- Demographic variables as potential moderators

#### 3.6.1.4 Regression Modelling

Multiple regression models explore predictors of improvement, with improvement percentage as the dependent variable and candidate predictors including:
- Initial intensity rating
- Number of rounds completed
- Message count (conversational engagement)
- PHQ-9 baseline score
- Demographic variables (age group, industry)

This analysis addresses RQ4 by identifying interaction patterns associated with successful outcomes.

### 3.6.2 Qualitative Analysis

#### 3.6.2.1 Thematic Analysis

User-generated content (problem descriptions, emotional vocabulary) is analysed using reflexive thematic analysis following Braun and Clarke's (2006) six-phase approach:

1. **Familiarisation**: Immersive reading of transcripts to develop understanding
2. **Coding**: Systematic generation of initial codes capturing semantic content
3. **Theme development**: Collating codes into candidate themes
4. **Theme review**: Checking themes against coded extracts and full dataset
5. **Theme definition**: Refining and naming themes
6. **Writing**: Weaving analysis into coherent narrative

This analysis illuminates the types of concerns users bring to the intervention, the language of anxiety expression, and the process of articulating previously diffuse distress—directly addressing RQ3.

#### 3.6.2.2 Conversation Pattern Analysis

Conversational transcripts are analysed for interaction patterns including:
- **Turn-taking dynamics**: Message lengths, response patterns, conversational flow
- **Sentiment progression**: Emotional valence changes across the conversation
- **State transition sequences**: Common paths through the state machine, divergent trajectories
- **Verbatim mirroring**: Instances where AI reflects user language, and user responses

This analysis supports RQ1 by revealing effective and ineffective interaction patterns.

#### 3.6.2.3 AI Output Evaluation

AI-generated setup statements and advice are evaluated for:
- Grammatical correctness and naturalness
- Contextual appropriateness (alignment with user-provided content)
- Protocol fidelity (adherence to EFT statement structure)
- Personalisation evidence (incorporation of user-specific details)

This evaluation addresses RQ2 by assessing the quality of AI-driven personalisation.

## 3.7 Ethical Considerations

### 3.7.1 Informed Consent

Participants provide informed consent through a digital consent process prior to system access. The consent information explains:
- The research purpose and procedures
- The nature of AI-generated content
- Data collection and storage practices
- The voluntary nature of participation
- The right to withdraw at any time
- Limitations of the intervention (not a substitute for professional treatment)

Consent is recorded digitally with timestamps for audit purposes.

### 3.7.2 Data Protection and Privacy

Data handling adheres to General Data Protection Regulation (GDPR) requirements:
- **Lawful basis**: Consent for research purposes
- **Data minimisation**: Collection limited to research-necessary information
- **Security**: Data encrypted in transit (HTTPS) and at rest (Supabase encryption)
- **Access control**: Row-level security ensures users access only their own data
- **Anonymisation**: Analysis datasets are de-identified, with user IDs replaced by anonymous identifiers

### 3.7.3 Crisis Detection and Response

Given the sensitive nature of anxiety-related content, the system implements crisis detection mechanisms:
- PHQ-9 item 9 responses indicating suicidal ideation trigger immediate display of crisis resources (Samaritans helpline, emergency services information)
- Conversational content is monitored for crisis keywords, though the AI is not designed to provide crisis intervention
- Users flagged for crisis concerns are marked in the database for ethical review

The system explicitly positions itself as a self-help tool, not a replacement for professional mental health treatment, and encourages users experiencing severe distress to seek appropriate professional support.

### 3.7.4 Psychological Safety

The AI is designed to validate user experiences rather than minimise, dismiss, or challenge emotional content. Prompt engineering emphasises:
- Non-judgmental acceptance of all presented concerns
- Avoidance of toxic positivity or unsolicited advice
- Gentle guidance rather than directive instruction
- Acknowledgment of difficulty and courage in seeking support

### 3.7.5 Ethical Approval

This research requires ethical approval from the relevant university ethics committee. The application addresses human participant protections, data handling procedures, crisis protocols, and the novel considerations arising from AI-mediated intervention research.

## 3.8 Validity and Reliability

### 3.8.1 Construct Validity

**SUDS**: The Subjective Units of Distress Scale has extensive use in anxiety and trauma research, including the majority of EFT outcome studies (Church, 2013). While subjective, SUDS demonstrates convergent validity with physiological arousal measures and correlates with standardised anxiety instruments (Tanner, 2012).

**PHQ-9**: The PHQ-9 is a well-validated instrument with established psychometric properties. Kroenke et al. (2001) reported excellent internal reliability (Cronbach's α = 0.89) and strong criterion validity against structured clinical interviews for major depression.

**Improvement Percentage**: This derived metric (percentage reduction in SUDS) enables comparison across different initial intensity levels and aligns with standard effect size conceptualisations.

### 3.8.2 Internal Validity

Internal validity—the extent to which observed changes can be attributed to the intervention—is limited by the absence of a control group. Without random assignment to intervention and control conditions, alternative explanations for observed improvements cannot be definitively ruled out. These include:
- Regression to the mean (high initial distress naturally decreasing)
- Passage of time (distress resolving independently)
- Placebo effects (expectation of benefit producing improvement)
- Non-specific therapeutic factors (attention, expression, validation)

However, several design features partially address internal validity concerns:
- Within-session measurement reduces temporal confounds
- The structured state machine ensures consistent intervention delivery
- Comparison of outcomes across sessions within individuals enables each user to serve as their own control

The research prioritises external validity and ecological validity appropriate to an exploratory DSR study, with internal validity limitations acknowledged explicitly.

### 3.8.3 External Validity

External validity—generalisability of findings—is constrained by the convenience sampling approach. The sample likely over-represents university-affiliated individuals, technology-comfortable users, and those with interest in alternative/complementary approaches to mental health. Findings may not generalise to:
- Older adults unfamiliar with digital interfaces
- Individuals with severe mental illness
- Clinical populations receiving concurrent treatment
- Culturally diverse populations with different health beliefs

Demographic data collection (age group, industry) enables characterisation of the achieved sample and identification of potential subgroup differences.

### 3.8.4 Reliability

**Data Collection Reliability**: Automated data collection eliminates human error in recording outcomes. SUDS ratings are captured exactly as entered; conversational content is stored verbatim; timestamps are system-generated.

**Intervention Reliability**: The state machine and prompt engineering ensure consistent intervention delivery across users. Unlike human-delivered therapy, the AI provides equivalent attentiveness and protocol adherence regardless of session number or time of day.

**Inter-Rater Reliability**: For qualitative coding, a subset of transcripts will be independently coded by a second researcher to assess agreement. Cohen's kappa will be calculated to quantify inter-rater reliability, with values above 0.7 considered acceptable (McHugh, 2012).

## 3.9 Limitations

Several methodological limitations warrant acknowledgment:

**Absence of Physiological Verification**: The study relies entirely on self-reported distress (SUDS). Physiological measures such as heart rate variability, galvanic skin response, or cortisol levels would provide objective corroboration but are impractical in an unsupervised digital context. Future research could integrate wearable devices for multi-modal measurement.

**Assumed Somatic Compliance**: The system guides users through tapping sequences but cannot verify that users actually perform the physical tapping. Some observed effects might derive from cognitive and breathing components rather than meridian stimulation. This limitation is inherent to remote, unsupervised delivery.

**Single-Session Focus**: Primary analysis focuses on within-session change. While the system supports multiple sessions, the research design does not prioritise longitudinal follow-up. Durability of effects and cumulative benefits remain unexplored.

**No Active Control Group**: The absence of a control condition (e.g., conversation without tapping, tapping without AI personalisation) precludes isolation of specific active ingredients. The research establishes whether the complete intervention produces benefit, not which components are essential.

**AI Unpredictability**: Despite bounded prompt engineering, large language models can produce unexpected outputs. Rare edge cases may occur that deviate from intended therapeutic parameters. Continuous monitoring and prompt refinement address this limitation.

**Researcher Allegiance**: The researcher designed the system and prompts, creating potential allegiance bias toward positive interpretation of findings. This is partially mitigated by reliance on automated quantitative metrics and systematic qualitative coding with reliability checks.

**Self-Selection Bias**: Participants who complete the intervention may differ systematically from those who drop out. Analysis of dropout patterns and comparison of completers versus non-completers partially addresses this, but selection effects remain a concern.

## 3.10 Summary

This chapter has presented the methodological framework for investigating human–AI collaboration in EFT-based digital mental health intervention. The research employs Design Science Research combined with mixed-methods data collection and analysis, operationalised through the Tapaway system artefact. Quantitative outcome measures (SUDS, PHQ-9, session metrics) and qualitative conversational data enable comprehensive evaluation addressing all four research questions.

The study's strengths include ecological validity (naturalistic digital self-help context), rich multi-tier data collection, and novel integration of therapeutic protocol with AI capabilities. Limitations include absence of control conditions, reliance on self-report measures, and generalisability constraints from convenience sampling.

Ethical safeguards—including informed consent, data protection, crisis detection, and psychological safety protocols—ensure responsible conduct of research involving vulnerable populations and AI-mediated intervention. The methodology positions this research to generate both practical outcomes (an effective digital intervention) and theoretical contributions (design principles for human–AI collaboration in mental health contexts).

---

## References

Abd-Alrazaq, A. A., Alajlani, M., Alalwan, A. A., Bewick, B. M., Gardner, P., & Househ, M. (2019). An overview of the features of chatbots in mental health: A scoping review. *International Journal of Medical Informatics, 132*, 103978.

Bach, D., Groesbeck, G., Stapleton, P., Sims, R., Blickheuser, K., & Church, D. (2019). Clinical EFT (Emotional Freedom Techniques) improves multiple physiological markers of health. *Journal of Evidence-Based Integrative Medicine, 24*, 2515690X18823691.

Braun, V., & Clarke, V. (2006). Using thematic analysis in psychology. *Qualitative Research in Psychology, 3*(2), 77-101.

Church, D. (2013). Clinical EFT as an evidence-based practice for the treatment of psychological and physiological conditions. *Psychology, 4*(8), 645-654.

Church, D., Yount, G., & Brooks, A. J. (2012). The effect of emotional freedom techniques on stress biochemistry: A randomized controlled trial. *The Journal of Nervous and Mental Disease, 200*(10), 891-896.

Clond, M. (2016). Emotional Freedom Techniques for anxiety: A systematic review with meta-analysis. *The Journal of Nervous and Mental Disease, 204*(5), 388-395.

Creswell, J. W., & Plano Clark, V. L. (2017). *Designing and conducting mixed methods research* (3rd ed.). Sage.

Etikan, I., Musa, S. A., & Alkassim, R. S. (2016). Comparison of convenience sampling and purposive sampling. *American Journal of Theoretical and Applied Statistics, 5*(1), 1-4.

Gregor, S., & Hevner, A. R. (2013). Positioning and presenting design science research for maximum impact. *MIS Quarterly, 37*(2), 337-355.

Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly, 28*(1), 75-105.

Klos, M. C., Escoredo, M., Joerin, A., Lemos, V. N., Rauws, M., & Bunge, E. L. (2021). Artificial intelligence-based chatbot for anxiety and depression in university students: Pilot randomized controlled trial. *JMIR Formative Research, 5*(8), e20678.

Kroenke, K., Spitzer, R. L., & Williams, J. B. (2001). The PHQ-9: Validity of a brief depression severity measure. *Journal of General Internal Medicine, 16*(9), 606-613.

Manole, A. M., Dascalu, M., & Virlan, G. (2024). AI-powered mental health support: A systematic review of conversational agents for anxiety and depression. *Computers in Human Behavior, 152*, 108054.

McHugh, M. L. (2012). Interrater reliability: The kappa statistic. *Biochemia Medica, 22*(3), 276-282.

Peffers, K., Tuunanen, T., Rothenberger, M. A., & Chatterjee, S. (2007). A design science research methodology for information systems research. *Journal of Management Information Systems, 24*(3), 45-77.

Tanner, B. A. (2012). Validity of global physical and emotional SUDS. *Applied Psychophysiology and Biofeedback, 37*(1), 31-34.

Wolpe, J. (1969). *The practice of behavior therapy*. Pergamon Press.
