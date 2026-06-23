import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  BookOpen,
  Shield,
  CheckCircle2,
  Mail,
  ChevronUp,
  Gamepad2,
  Brain,
  Zap,
  Globe,
  Rocket,
  ArrowRight,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

/* ─── Animation helpers ─── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 14 },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerContainerSlow: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 12 },
  },
};

/* ─── Floating Paw SVG Component ─── */
function FloatingPaw({ className, fill = '#A78BFA', size = 60 }: { className?: string; fill?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      className={className}
    >
      <ellipse cx="40" cy="50" rx="18" ry="16" fill={fill} stroke="#000" strokeWidth="3" />
      <ellipse cx="22" cy="28" rx="10" ry="12" fill={fill} stroke="#000" strokeWidth="3" />
      <ellipse cx="40" cy="20" rx="10" ry="14" fill={fill} stroke="#000" strokeWidth="3" />
      <ellipse cx="58" cy="28" rx="10" ry="12" fill={fill} stroke="#000" strokeWidth="3" />
    </svg>
  );
}

/* ─── Animated Paw (floating bob) ─── */
function AnimatedPaw({
  className,
  fill = '#A78BFA',
  size = 60,
  delay = 0,
}: {
  className?: string;
  fill?: string;
  size?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -12, 0], rotate: [0, 3, 0, -3, 0] }}
      transition={{ duration: 5 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <FloatingPaw fill={fill} size={size} />
    </motion.div>
  );
}

/* ─── Section wrapper with scroll-trigger ─── */
function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={staggerContainer}
    >
      {children}
    </motion.section>
  );
}

/* ─── Section title component ─── */
function SectionTitle({
  title,
  subtitle,
  light = false,
}: {
  title: string;
  subtitle?: string;
  light?: boolean;
}) {
  return (
    <motion.div className="text-center mb-12" variants={fadeUp}>
      <h2
        className={`font-fredoka font-semibold text-3xl sm:text-4xl md:text-[44px] text-outline-sm ${
          light ? 'text-white' : 'text-purple-dark'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`font-nunito text-base mt-3 max-w-xl mx-auto ${
            light ? 'text-purple-lighter' : 'text-purple-dark'
          }`}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   SECTION 1: HERO
   ═══════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-purple-dark py-14 sm:py-16 px-6">
      {/* Floating paw decorations */}
      <AnimatedPaw className="absolute top-8 left-6 opacity-[0.08]" size={100} fill="#A78BFA" delay={0} />
      <AnimatedPaw className="absolute bottom-8 right-8 opacity-[0.08]" size={80} fill="#A78BFA" delay={1} />
      <AnimatedPaw className="absolute top-20 right-[15%] opacity-[0.06]" size={60} fill="#A78BFA" delay={2} />
      <AnimatedPaw className="absolute bottom-12 left-[20%] opacity-[0.06]" size={50} fill="#A78BFA" delay={0.5} />

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
        {/* Text */}
        <motion.div
          className="flex-1 text-center md:text-left"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring' as const, stiffness: 120, damping: 14 }}
        >
          <h1 className="font-fredoka font-bold text-4xl sm:text-5xl text-white text-outline mb-4">
            About CyberPaws
          </h1>
          <p className="font-nunito text-lg text-purple-lighter max-w-xl mx-auto md:mx-0">
            Making cybersecurity education fun, safe, and accessible for every child
          </p>
        </motion.div>

        {/* Hero image */}
        <motion.div
          className="flex-shrink-0"
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring' as const, stiffness: 120, damping: 14, delay: 0.3 }}
        >
          <img
            src="/about-team-cats.jpg"
            alt="CyberPaws team of cartoon cats"
            className="w-[260px] sm:w-[300px] h-auto rounded-2xl border-4 border-black shadow-solid-lg"
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 2: MISSION
   ═══════════════════════════════════════════ */
const missionCards = [
  {
    title: 'Educate',
    description: 'Teach kids real cybersecurity skills through play. Every game is designed to build practical knowledge in a fun, interactive way.',
    icon: BookOpen,
    color: '#7C3AED',
    bgColor: '#F5F3FF',
  },
  {
    title: 'Protect',
    description: 'Build awareness that keeps children safe online. We empower kids to recognize threats and protect themselves.',
    icon: Shield,
    color: '#F472B6',
    bgColor: '#FDF2F8',
  },
  {
    title: 'Inspire',
    description: 'Spark curiosity for technology and ethical hacking. We plant the seeds for the next generation of cyber defenders.',
    icon: Rocket,
    color: '#FACC15',
    bgColor: '#FEFCE8',
  },
];

function MissionSection() {
  return (
    <Section className="py-16 sm:py-20 px-6 bg-purple-pale/50">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          title="Our Mission"
          subtitle="Three things we believe every child deserves"
        />

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          variants={staggerContainerSlow}
        >
          {missionCards.map((card) => (
            <motion.div
              key={card.title}
              className="bg-white border-4 border-black rounded-2xl p-8 text-center relative overflow-hidden transition-transform hover:-translate-y-1.5"
              variants={fadeUp}
              whileHover={{ scale: 1.03 }}
            >
              {/* Icon circle */}
              <motion.div
                className="w-20 h-20 rounded-full border-[3px] border-black flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: card.color }}
                variants={scaleIn}
              >
                <card.icon size={36} className="text-white" strokeWidth={2.5} />
              </motion.div>

              <h3 className="font-fredoka font-semibold text-[22px] text-purple-dark mb-3">
                {card.title}
              </h3>
              <p className="font-nunito text-[15px] text-purple-dark leading-relaxed">
                {card.description}
              </p>

              {/* Decorative paw watermark */}
              <div className="absolute bottom-2 right-2 opacity-10 pointer-events-none">
                <FloatingPaw size={40} fill="#A78BFA" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 3: SAFETY PROMISE
   ═══════════════════════════════════════════ */
const safetyItems = [
  { title: 'No personal information required', desc: 'Kids can play without email, phone, or any personal information.' },
  { title: 'No ads or external links', desc: 'Our platform has zero links to external websites or social media.' },
  { title: 'No in-app purchases', desc: 'Everything is free. No paywalls, no premium content, no tricks.' },
  { title: 'COPPA compliant design', desc: 'We follow the Children\'s Online Privacy Protection Act strictly.' },
  { title: 'All content kid-approved', desc: 'Every game is reviewed by educators and tested by kids.' },
  { title: 'Positive, encouraging feedback only', desc: 'No negative scoring — learning is always rewarding and uplifting.' },
];

function SafetySection() {
  return (
    <Section className="py-16 sm:py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionTitle title="The CyberPaws Safety Promise" />

        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          {/* Shield illustration */}
          <motion.div
            className="flex-shrink-0"
            variants={{
              hidden: { opacity: 0, x: -30 },
              visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 14 } },
            }}
          >
            <motion.img
              src="/safety-promise.jpg"
              alt="Safety Promise Shield"
              className="w-[280px] sm:w-[360px] h-auto rounded-2xl border-4 border-black shadow-solid"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          {/* Checklist */}
          <motion.div
            className="flex-1 flex flex-col gap-4"
            variants={staggerContainer}
          >
            {safetyItems.map((item) => (
              <motion.div
                key={item.title}
                className="flex items-start gap-4 bg-purple-pale/40 border-[3px] border-black rounded-xl p-4 transition-transform hover:translate-x-1"
                variants={{
                  hidden: { opacity: 0, x: 30 },
                  visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 14 } },
                }}
              >
                <motion.div
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-green-success border-2 border-black flex items-center justify-center mt-0.5"
                  variants={scaleIn}
                >
                  <CheckCircle2 size={18} className="text-white" strokeWidth={3} />
                </motion.div>
                <div>
                  <h4 className="font-nunito font-bold text-base text-purple-dark">
                    {item.title}
                  </h4>
                  <p className="font-nunito text-sm text-purple-dark/80 mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 4: HOW IT WORKS
   ═══════════════════════════════════════════ */
const steps = [
  {
    number: 1,
    title: 'Choose a Mission',
    description: 'Pick from 24+ cybersecurity games covering passwords, phishing, encryption, and more.',
    icon: Gamepad2,
  },
  {
    number: 2,
    title: 'Learn by Playing',
    description: 'Interactive simulations teach real security skills through fun, hands-on challenges.',
    icon: Brain,
  },
  {
    number: 3,
    title: 'Earn XP & Badges',
    description: 'Track your progress with gamification. Collect badges and climb the leaderboard.',
    icon: Zap,
  },
  {
    number: 4,
    title: 'Become a Cyber Guardian',
    description: 'Master cybersecurity skills and help your friends stay safe online too!',
    icon: Shield,
  },
];

function HowItWorksSection() {
  return (
    <Section className="py-16 sm:py-20 px-6 bg-purple-lighter/60">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          title="How CyberPaws Works"
          subtitle="Your journey to becoming a cyber hero in four simple steps"
        />

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative"
          variants={staggerContainerSlow}
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              className="relative"
              variants={fadeUp}
            >
              <div className="bg-white border-4 border-black rounded-2xl p-6 text-center h-full transition-transform hover:-translate-y-1.5">
                {/* Number circle */}
                <motion.div
                  className="w-14 h-14 rounded-full bg-purple-primary border-[3px] border-black flex items-center justify-center mx-auto mb-4"
                  variants={scaleIn}
                >
                  <span className="font-fredoka font-bold text-xl text-white">{step.number}</span>
                </motion.div>

                {/* Icon */}
                <div className="mb-3 flex justify-center">
                  <step.icon size={32} className="text-purple-light" strokeWidth={2.5} />
                </div>

                <h3 className="font-fredoka font-semibold text-lg text-purple-dark mb-2">
                  {step.title}
                </h3>
                <p className="font-nunito text-sm text-purple-dark leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connecting arrow (desktop only, between items) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight size={24} className="text-purple-primary" strokeWidth={3} />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 5: MEET THE TEAM
   ═══════════════════════════════════════════ */
const teamMembers = [
  {
    name: 'Luna',
    role: 'Chief Security Cat',
    description: 'The fearless leader who makes all the big decisions. Luna oversees the platform with a sharp eye and a warm heart.',
    funFact: 'Can spot a phishing email from a mile away!',
    initial: 'L',
    color: '#7C3AED',
    borderColor: '#5B21B6',
  },
  {
    name: 'Milo',
    role: 'Head of Education',
    description: 'A passionate teacher who turns complex cybersecurity concepts into fun, kid-friendly lessons and games.',
    funFact: 'Has read over 500 books about online safety.',
    initial: 'M',
    color: '#4ADE80',
    borderColor: '#16A34A',
  },
  {
    name: 'Zara',
    role: 'Lead Developer',
    description: 'The coding genius who builds all the games and simulations. Zara makes sure everything runs purr-fectly.',
    funFact: 'Types 120 lines of code per minute with her paws!',
    initial: 'Z',
    color: '#F472B6',
    borderColor: '#DB2777',
  },
  {
    name: 'Oliver',
    role: 'Safety Officer',
    description: 'The vigilant guardian who ensures every part of CyberPaws is 100% safe, friendly, and appropriate for kids.',
    funFact: 'Takes 5 nap breaks a day — safety is exhausting!',
    initial: 'O',
    color: '#60A5FA',
    borderColor: '#2563EB',
  },
];

function TeamSection() {
  return (
    <Section className="py-16 sm:py-20 px-6 bg-purple-pale/50">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          title="Meet the CyberPaws Team"
          subtitle="The cats behind the code"
        />

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainerSlow}
        >
          {teamMembers.map((member) => (
            <motion.div
              key={member.name}
              className="bg-white border-4 border-black rounded-2xl p-6 text-center relative overflow-hidden transition-transform hover:-translate-y-1.5"
              variants={fadeUp}
              whileHover={{ scale: 1.03 }}
            >
              {/* Avatar */}
              <motion.div
                className="w-24 h-24 rounded-full border-[3px] border-black flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: member.color }}
                variants={scaleIn}
              >
                <span className="font-fredoka font-bold text-3xl text-white text-outline-sm">
                  {member.initial}
                </span>
              </motion.div>

              <h3 className="font-fredoka font-semibold text-xl text-purple-dark">
                {member.name}
              </h3>
              <p className="font-nunito font-semibold text-sm text-purple-primary mt-1">
                {member.role}
              </p>
              <p className="font-nunito text-[13px] text-purple-dark mt-3 leading-relaxed">
                {member.description}
              </p>
              <p className="font-nunito text-xs text-purple-light mt-2 italic">
                &ldquo;{member.funFact}&rdquo;
              </p>

              {/* Decorative paw */}
              <div className="absolute bottom-2 right-2 opacity-10 pointer-events-none">
                <FloatingPaw size={32} fill="#A78BFA" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 6: PARENT'S GUIDE
   ═══════════════════════════════════════════ */
const parentTopics = [
  {
    question: 'What will my child learn?',
    answer:
      'Your child will learn essential cybersecurity skills including password security, recognizing phishing attempts, understanding encryption, firewall basics, safe browsing habits, and how to protect their personal information online. Each concept is taught through interactive games designed by educators.',
  },
  {
    question: 'Is it really safe?',
    answer:
      'Absolutely. CyberPaws is COPPA-compliant and collects zero personal information. There are no ads, no external links, no chat features, and no in-app purchases. All content is reviewed by child safety experts and educators before release.',
  },
  {
    question: 'How much does it cost?',
    answer: 'CyberPaws is completely free! There are no subscriptions, no premium tiers, and no hidden costs. We are supported by educational grants and cybersecurity organizations committed to digital literacy for children.',
  },
  {
    question: 'What age is it for?',
    answer: 'CyberPaws is designed for ages 8-14, with adjustable difficulty levels. Younger children (ages 6-7) can play with parent guidance, and older kids will find the advanced missions challenging and engaging.',
  },
  {
    question: 'Can I track progress?',
    answer: 'Yes! The Parent Dashboard (coming soon) will show time spent, skills learned, missions completed, and recommended next steps. You\'ll receive weekly summaries of your child\'s learning journey.',
  },
  {
    question: 'How do I get started?',
    answer: 'Simply visit our website and start playing — no account required! For progress tracking, you can create a free optional account with just a username. No email or personal information needed.',
  },
];

function ParentsGuideSection() {
  return (
    <Section className="py-16 sm:py-20 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <SectionTitle
          title="A Note for Parents"
          subtitle="Everything you need to know about your child's cybersecurity journey"
        />

        <motion.div variants={fadeUp}>
          <Accordion type="single" collapsible className="space-y-3">
            {parentTopics.map((topic, i) => (
              <AccordionItem
                key={i}
                value={`parent-${i}`}
                className="border-[3px] border-black rounded-xl overflow-hidden bg-white data-[state=open]:bg-purple-pale"
              >
                <AccordionTrigger className="px-5 py-4 font-nunito font-semibold text-base text-purple-dark hover:no-underline hover:translate-x-1 transition-transform [&[data-state=open]>svg]:rotate-180">
                  {topic.question}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4 font-nunito text-[15px] text-purple-dark leading-relaxed">
                  {topic.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 7: FAQ
   ═══════════════════════════════════════════ */
const faqItems = [
  {
    question: 'What is CyberPaws?',
    answer:
      'CyberPaws is a free educational platform where kids learn cybersecurity through fun, interactive games and simulations. Think of it as a digital playground where children become cyber heroes while learning real-world security skills!',
  },
  {
    question: 'Is it really free?',
    answer:
      'Yes, completely free! No ads, no in-app purchases, no subscriptions. We are supported by educational grants and cybersecurity organizations who believe every child deserves digital literacy.',
  },
  {
    question: 'What ages is it for?',
    answer:
      'Kids aged 8-14, with adjustable difficulty levels. Younger kids can play with parent guidance, and older kids will find the advanced missions challenging and rewarding.',
  },
  {
    question: 'Do I need to create an account?',
    answer:
      'Optional, but recommended! You can start playing immediately without any account. Creating a free account lets you save progress, earn badges, and track your journey on the leaderboard.',
  },
  {
    question: 'What devices can I use?',
    answer:
      'Any device with a web browser — computers, tablets, Chromebooks, and smartphones. CyberPaws works on Windows, macOS, Linux, iOS, and Android. No app download needed!',
  },
  {
    question: "Is my child's data safe?",
    answer:
      'We collect no personal data whatsoever. Progress can be stored locally on your device or with an optional anonymous username. We are fully COPPA-compliant and take child privacy extremely seriously.',
  },
  {
    question: 'What skills will my child learn?',
    answer:
      'Password security, phishing detection, encryption basics, firewall concepts, safe browsing, malware awareness, network security, and digital privacy. All concepts are based on real cybersecurity practices, simplified for children.',
  },
  {
    question: 'How are the games educational?',
    answer:
      'Each game simulates real security tools and scenarios. For example, our password game teaches entropy and strength measurement, while our phishing game trains pattern recognition for suspicious emails. Kids learn by doing!',
  },
];

function FAQSection() {
  return (
    <Section className="py-16 sm:py-20 px-6 bg-purple-lighter/40">
      <div className="max-w-3xl mx-auto">
        <SectionTitle
          title="Frequently Asked Questions"
          subtitle="Everything you wanted to know about CyberPaws"
        />

        <motion.div variants={fadeUp}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-[3px] border-black rounded-xl overflow-hidden bg-white data-[state=open]:bg-purple-pale"
              >
                <AccordionTrigger className="px-5 py-4 font-nunito font-semibold text-base text-purple-dark hover:no-underline hover:translate-x-1 transition-transform [&[data-state=open]>svg]:rotate-180">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-4 font-nunito text-[15px] text-purple-dark leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 8: NEWSLETTER / CONTACT
   ═══════════════════════════════════════════ */
function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <Section className="py-16 sm:py-20 px-6 bg-purple-dark relative overflow-hidden">
      {/* Floating paws */}
      <AnimatedPaw className="absolute top-6 left-8 opacity-[0.06]" size={80} fill="#A78BFA" delay={0} />
      <AnimatedPaw className="absolute bottom-6 right-12 opacity-[0.06]" size={60} fill="#A78BFA" delay={1.5} />

      <div className="max-w-4xl mx-auto">
        <motion.div className="text-center mb-10" variants={fadeUp}>
          <h2 className="font-fredoka font-semibold text-3xl sm:text-4xl text-white text-outline-sm mb-3">
            Stay Updated
          </h2>
          <p className="font-nunito text-base text-purple-lighter">
            Get notified about new games and features
          </p>
        </motion.div>

        {/* Two-column: Contact left, Newsletter right */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-10"
          variants={staggerContainer}
        >
          {/* Contact info */}
          <motion.div variants={fadeUp} className="space-y-4">
            <h3 className="font-fredoka font-semibold text-2xl text-white mb-4">Get in Touch</h3>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-darker border-[3px] border-black flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-white" />
              </div>
              <span className="font-nunito text-base text-purple-lighter">paws@cyberpaws.kids</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-darker border-[3px] border-black flex items-center justify-center flex-shrink-0">
                <Globe size={18} className="text-white" />
              </div>
              <span className="font-nunito text-base text-purple-lighter">cyberpaws.kids</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-darker border-[3px] border-black flex items-center justify-center flex-shrink-0">
                <Shield size={18} className="text-green-success" />
              </div>
              <span className="font-nunito text-sm text-green-success">COPPA Certified &amp; Kid-Safe</span>
            </div>
          </motion.div>

          {/* Newsletter form */}
          <motion.div variants={fadeUp}>
            <h3 className="font-fredoka font-semibold text-xl text-white mb-3">Parent Newsletter</h3>
            <p className="font-nunito text-sm text-purple-lighter mb-4">
              Monthly tips on keeping kids safe online, plus CyberPaws updates.
            </p>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-5 py-3 rounded-full border-[3px] border-black bg-white font-nunito text-sm text-purple-dark placeholder:text-purple-light focus:outline-none focus:ring-2 focus:ring-yellow-accent"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-full border-[3px] border-black bg-yellow-accent font-fredoka font-semibold text-sm text-black transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                {submitted ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>

            <p className="font-nunito text-xs text-purple-light mt-3">
              No spam. Unsubscribe anytime.
            </p>
          </motion.div>
        </motion.div>

        {/* Final CTA */}
        <motion.div className="text-center mt-14" variants={fadeUp}>
          <h3 className="font-fredoka font-bold text-2xl sm:text-3xl text-white text-outline-sm mb-6">
            Ready to Become a Cyber Hero?
          </h3>
          <Link
            to="/games"
            className="inline-block px-10 py-4 rounded-full border-4 border-black bg-yellow-accent font-fredoka font-semibold text-lg text-black transition-transform hover:scale-105 active:scale-95 shadow-solid"
          >
            Start Playing Free
          </Link>
          <p className="font-nunito text-sm text-purple-lighter mt-4 flex items-center justify-center gap-2 flex-wrap">
            <span>100% Free</span>
            <FloatingPaw size={14} fill="#A78BFA" />
            <span>No Account Required</span>
            <FloatingPaw size={14} fill="#A78BFA" />
            <span>Kid Safe</span>
          </p>
        </motion.div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 9: BACK TO TOP BUTTON
   ═══════════════════════════════════════════ */
function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-purple-primary border-4 border-black flex items-center justify-center shadow-solid transition-transform hover:scale-110 active:scale-95"
          aria-label="Back to top"
        >
          {/* Paw shape: main pad + toe */}
          <div className="relative">
            <ChevronUp size={28} className="text-white" strokeWidth={3} />
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════
   MAIN ABOUT PAGE
   ═══════════════════════════════════════════ */
export default function About() {
  return (
    <div className="overflow-hidden">
      <HeroSection />
      <MissionSection />
      <SafetySection />
      <HowItWorksSection />
      <TeamSection />
      <ParentsGuideSection />
      <FAQSection />
      <NewsletterSection />
      <BackToTop />
    </div>
  );
}
