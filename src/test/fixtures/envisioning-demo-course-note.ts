/**
 * Demo fixture — Session 2 Information Processing.
 * Based on the course note prose with added relation-bearing summary sentences
 * so the benchmark/envisioning pipeline can extract verified relations.
 */
export const envisioningDemoCourseNote = {
  title: "Session 2 envisioning demo (Information Processing)",
  text: `Course Notes — SESSION 2

INFORMATION PROCESSING

Introduction

In our previous session, we characterized learning in AI systems and organizations as a process of using feedback to assign credit to problem-solving actions. By convention, we will from now on usually refer to feedback as "information". This term will flexibly stand in for data, sense perceptions, or knowledge while we study how intelligently learning to assign credit depends on assumptions about information units.

Establishing some shared terminology

Before diving into the two approaches to information, let us establish some shared terminology. This shared terminology will empower us to think about credit assignment in precise terms across diverse AI ideas.

First, by information, we will refer not just to numerical data, but to any types of symbols for describing physical objects in, or concepts about, the world. Symbols may include alphabetic characters, words, images, videos, sound waves, or any other observations that can be recorded.

Second, we will refer to any use of information to learn to assign credit to a problem as "information processing". By information processing, we will refer broadly to actions for storing, manipulating, displaying, and otherwise trafficking in information by agents interacting with problem-solving environments.

Third, we will view information processing as acts of communication among agents, and AI systems and organizations as communication systems. What agents do to be intelligent is essentially package information into messages that they send, or receive and evaluate messages from other agents. These actions are collectively referred to as "message passing", such that AI systems and organizations can also be called message passing systems.

Communication systems support information processing. Message passing systems require symbols. Feedback depends on information.

Framing credit assignment

With this terminology established, we can now frame the general intelligence problem of credit assignment in information processing terms:

Assigning credit is an information process of evaluating patterns in symbols about problems. Challenges of assigning credit arise from the need to evaluate more complex symbolic patterns.

AI ideas differ in the symbolic patterns that they take to be the basic units of information and, as a result, in how they conceive of the capacity required to process these patterns.

Approach 1: Shannon information (syntactic information processing)

In a 1948 paper, Shannon introduced an approach to thinking about information that has been so influential that it is still often simply called "information theory". He developed his approach while solving problems of routing calls over complex telephone networks at Bell Labs, yet Shannon had in mind a general theory of communication in any system.

We will understand the Shannon information approach in terms of three assumptions: information processing as syntactic; units of information as meaningless bits; and intelligently learning to assign credit as ultimately a matter of brute force.

Shannon proposed binary digits that he called "bits" as the building block units of syntactic information processing. Bits are linked together into messages as patterns called bit strings. Shannon also formalized a measure of uncertainty about the statistical distribution of message probabilities as a quantity that he called "entropy".

Telephone networks support syntactic processing. Syntactic processing uses bit strings. Entropy depends on bits.

Credit assignment as a challenge of limited channel capacity

What do Shannon's assumptions about bits and entropy imply about learning to assign credit? Overall, an agent's ability to learn to assign credit is a matter of their capacity for processing syntactic information. Shannon described limits to this capacity as arising from physical channels, or restricted pathways to send and receive messages, such as telephone networks or fiber optic cables.

Limits to channel capacity mean that only a certain amount of information, or bandwidth, can be processed at a certain speed over any one period of time. A conventional TV channel has access to only a limited amount of bandwidth, while fiber optic cables in a 5G network have more capacity. Channel capacity limits mean that information in messages is noisy when symbolic patterns are communicated with only limited reliability.

Syntactic capacity limits information processing. Fiber optic network has more capacity.

Approach 2: Simon information (semantic information processing)

In a famous 1962 paper titled "The Architecture of Complexity", Herbert Simon described an alternative to Shannon's approach. Simon developed his approach from research on decision-making in organizations and simulations of solving logic puzzles and playing chess.

We will contrast Simon information from Shannon's approach in terms of three assumptions: information processing as semantic and not just syntactic; the fundamental units of information as meaningful lists, rather than meaningless bits; and intelligent information processing as a matter of abstracting a problem to modularize it, rather than just adding channel capacity.

Simon proposed that bits should be organized into meaningful patterns called lists. Lists differ from bits in that they have a name designating what the symbols externally refer to in the physical or conceptual world.

Simon information contrasts with Shannon information. Reinforcement learning uses message passing.`,
  sourcePath: "src/test/fixtures/envisioning-demo-course-note.ts",
};
