import { useState } from 'react';
import { motion } from 'framer-motion';
import { Construction, Sparkles, BookOpen, Lightbulb, Lock } from 'lucide-react';

interface ComingSoonProps {
  gameTitle: string;
  gameDescription: string;
  category: string;
  difficulty: number;
}

const educationalContent: Record<string, { facts: string[]; concepts: string[]; realWorld: string }> = {
  'SQL Safari': {
    facts: [
      'SQL stands for Structured Query Language.',
      'Databases store information in tables like spreadsheets.',
      'SQL injection is when attackers sneak malicious code into queries.',
    ],
    concepts: [
      'Database tables and rows',
      'SQL SELECT statements',
      'Input sanitization',
      'Parameterized queries',
    ],
    realWorld: 'When you log into a website, the server checks your password against a database. If the site does not protect its SQL queries, hackers can trick the system into letting them in without a password!',
  },
  'Stego Spy': {
    facts: [
      'Steganography hides messages inside other files.',
      'Messages can be hidden in images, audio, or even videos.',
      'The hidden message does not change the file size much.',
    ],
    concepts: [
      'Least significant bit encoding',
      'Cover medium vs payload',
      'Steganalysis detection',
      'Digital watermarks',
    ],
    realWorld: 'Spies have used steganography for centuries! In the digital world, someone could hide a secret message inside a photo of a cat and post it online. Only someone with the right tool would know the message is there.',
  },
  'XSS Xpert': {
    facts: [
      'XSS stands for Cross-Site Scripting.',
      'Attackers inject malicious scripts into web pages.',
      'It can steal cookies, session tokens, or passwords.',
    ],
    concepts: [
      'Reflected vs stored XSS',
      'Input validation',
      'Content Security Policy',
      'Output encoding',
    ],
    realWorld: 'If a comment section on a website does not check what people type, a hacker could post a script that steals other visitors login cookies. That is why websites sanitize user input!',
  },
  'Cert Champion': {
    facts: [
      'Digital certificates prove a website is authentic.',
      'Certificates are issued by Certificate Authorities (CAs).',
      'HTTPS uses SSL/TLS certificates to encrypt data.',
    ],
    concepts: [
      'Public key infrastructure',
      'Certificate chains',
      'SSL/TLS handshake',
      'Certificate expiry',
    ],
    realWorld: 'When you see a padlock icon in your browser, it means the website has a valid certificate. Your bank, school, and favorite shopping sites all use certificates to keep your data safe.',
  },
  'Port Scanner Pro': {
    facts: [
      'Network ports are like doors to a computer.',
      'Port numbers range from 0 to 65535.',
      'Common ports: 80 (HTTP), 443 (HTTPS), 22 (SSH).',
    ],
    concepts: [
      'Well-known vs ephemeral ports',
      'TCP vs UDP',
      'Port scanning techniques',
      'Firewall rules',
    ],
    realWorld: 'Think of your house as a computer. Each door and window is a port. A port scanner is like checking which doors are unlocked. Security experts use them to find and fix weak points.',
  },
  'Hash Hacker': {
    facts: [
      'A hash turns any data into a fixed-size string.',
      'Hashes are one-way: you cannot reverse them.',
      'Same input always produces the same hash.',
    ],
    concepts: [
      'MD5, SHA-256, bcrypt',
      'Salt and pepper',
      'Rainbow tables',
      'Collision resistance',
    ],
    realWorld: 'When you create a password on a website, it stores a hash of your password, not the actual password. Even if hackers steal the database, they cannot easily figure out your real password from the hash.',
  },
  'Backup Builder': {
    facts: [
      'The 3-2-1 rule: 3 copies, 2 media types, 1 offsite.',
      'Ransomware can encrypt your files and demand payment.',
      'Backups are your best defense against data loss.',
    ],
    concepts: [
      'Full vs incremental backups',
      'Recovery Point Objective',
      'Cloud backups',
      'Backup encryption',
    ],
    realWorld: 'Imagine your computer suddenly stops working or gets infected with ransomware. If you have a recent backup on an external drive or cloud service, you can restore all your files and photos!',
  },
  'Social Shield': {
    facts: [
      'Social engineering tricks people into breaking security.',
      'It exploits human psychology, not technology.',
      'Pretexting, baiting, and tailgating are common techniques.',
    ],
    concepts: [
      'Phishing vs spear phishing',
      'Pretexting attacks',
      'Authority bias exploitation',
      'Verification protocols',
    ],
    realWorld: 'A hacker might call pretending to be IT support and ask for your password. Real IT would never do that! Always verify requests through a separate channel before sharing sensitive info.',
  },
  'Packet Patrol': {
    facts: [
      'Data travels over networks in small chunks called packets.',
      'Each packet has headers with routing information.',
      'Wireshark is a popular packet analysis tool.',
    ],
    concepts: [
      'TCP/IP packet structure',
      'Protocol analysis',
      'Packet filtering',
      'Network forensics',
    ],
    realWorld: 'When you stream a video, it is broken into thousands of packets that travel different paths to your device. Network analysts examine these packets to find problems or detect attacks.',
  },
  'Key Keeper': {
    facts: [
      'Encryption keys are like digital passwords for data.',
      'Symmetric keys are shared; asymmetric keys come in pairs.',
      'Key management is critical for security.',
    ],
    concepts: [
      'Symmetric vs asymmetric encryption',
      'Key rotation',
      'Hardware Security Modules',
      'Key escrow',
    ],
    realWorld: 'When you send a message on a secure app, your device and the recipients device exchange public keys. The messages are encrypted so only the intended recipient can read them.',
  },
  'Virus Vaccine': {
    facts: [
      'Antivirus software scans files for known malware signatures.',
      'Heuristic analysis detects unknown threats.',
      'Regular updates are essential for protection.',
    ],
    concepts: [
      'Signature-based detection',
      'Behavioral analysis',
      'Quarantine vs deletion',
      'Zero-day threats',
    ],
    realWorld: 'Antivirus software is like a flu shot for your computer. It learns to recognize bad software and stops it before it can infect your system. Keeping it updated is like getting your yearly vaccine!',
  },
  'WAF Warrior': {
    facts: [
      'A WAF is a Web Application Firewall.',
      'It filters and monitors HTTP traffic.',
      'It blocks SQL injection, XSS, and other attacks.',
    ],
    concepts: [
      'Rule-based filtering',
      'Rate limiting',
      'IP blocking',
      'OWASP Top 10 protection',
    ],
    realWorld: 'A WAF is like a security guard at the entrance to a website. It checks every visitor and blocks anyone trying to cause trouble, while letting legitimate visitors through.',
  },
  'DNS Detective': {
    facts: [
      'DNS converts domain names (like google.com) to IP addresses.',
      'DNS records include A, AAAA, CNAME, MX, and TXT types.',
      'DNS spoofing redirects users to fake sites.',
    ],
    concepts: [
      'DNS resolution process',
      'Record types',
      'DNS cache poisoning',
      'DNSSEC',
    ],
    realWorld: 'When you type a website address, DNS is like a phone book that looks up the actual server address. Hackers can poison this phone book to redirect you to fake banking sites!',
  },
  'Trojan Tracker': {
    facts: [
      'Trojans disguise themselves as legitimate software.',
      'They cannot spread on their own like viruses.',
      'Remote Access Trojans (RATs) give hackers full control.',
    ],
    concepts: [
      'Trojan vs virus vs worm',
      'Indicators of Compromise',
      'Behavioral detection',
      'Sandboxing',
    ],
    realWorld: 'A Trojan might look like a fun game or useful app, but once installed, it could steal your passwords or let hackers control your computer. Only download software from trusted sources!',
  },
  'Cipher Challenge': {
    facts: [
      'Substitution ciphers replace each letter with another.',
      'Frequency analysis helps break substitution ciphers.',
      'The Caesar cipher is a type of substitution cipher.',
    ],
    concepts: [
      'Monoalphabetic substitution',
      'Frequency analysis',
      'Key space',
      'Brute force attacks',
    ],
    realWorld: 'Ancient Romans used substitution ciphers to send secret military messages. Today, the same concepts help us understand how modern encryption works and why strong keys matter.',
  },
  'Phish Frenzy': {
    facts: [
      'Phishing is the most common cyber attack.',
      'Spear phishing targets specific individuals.',
      'Lookalike domains trick people (paypa1.com vs paypal.com).',
    ],
    concepts: [
      'Email header analysis',
      'Domain spoofing',
      'Urgency tactics',
      'Multi-factor authentication',
    ],
    realWorld: 'Even smart people can fall for phishing! The best defense is to always verify unusual requests directly with the sender through a different channel, and enable two-factor authentication.',
  },
  'Access Ace': {
    facts: [
      'Access control limits who can do what.',
      'Principle of least privilege: give minimum necessary access.',
      'RBAC (Role-Based Access Control) is widely used.',
    ],
    concepts: [
      'Authentication vs authorization',
      'ACLs and permissions',
      'Least privilege principle',
      'Access auditing',
    ],
    realWorld: 'In a school, teachers can access gradebooks but students cannot. This is access control in action! The same principle protects computer systems from unauthorized actions.',
  },
  'Log Analyzer': {
    facts: [
      'Logs record events that happen on a system.',
      'SIEM tools collect and analyze logs from many sources.',
      'Unusual patterns in logs can reveal attacks.',
    ],
    concepts: [
      'Log formats (syslog, JSON)',
      'Correlation rules',
      'Alert thresholds',
      'Forensic timeline',
    ],
    realWorld: 'When a company gets hacked, investigators analyze logs to figure out what happened, when it started, and what data was accessed. Good logging is like having security cameras for your network!',
  },
  default: {
    facts: [
      'Cybersecurity protects computers, networks, and data.',
      'There are over 3.5 million unfilled cybersecurity jobs worldwide.',
      'The first computer virus was created in 1986.',
    ],
    concepts: [
      'Confidentiality, Integrity, Availability (CIA)',
      'Defense in depth',
      'Threat modeling',
      'Incident response',
    ],
    realWorld: 'Every time you use the internet, cybersecurity is working behind the scenes to keep your information safe. From passwords to encryption, many tools work together to protect you!',
  },
};

export default function ComingSoon({ gameTitle, gameDescription, category, difficulty }: ComingSoonProps) {
  const [activeTab, setActiveTab] = useState<'learn' | 'hints'>('learn');
  const content = educationalContent[gameTitle] || educationalContent.default;

  const difficultyLabel = difficulty === 1 ? 'Easy' : difficulty === 2 ? 'Medium' : 'Hard';
  const difficultyColor = difficulty === 1 ? '#4ADE80' : difficulty === 2 ? '#FACC15' : '#F87171';

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-lg mx-auto">
      {/* Construction Header */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-accent rounded-full border-4 border-black mb-4">
          <Construction size={40} strokeWidth={3} className="text-black" />
        </div>
        <h2 className="font-fredoka font-bold text-2xl text-purple-dark text-outline-sm mb-2">
          {gameTitle}
        </h2>
        <p className="font-nunito text-sm text-purple-dark mb-3">{gameDescription}</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span
            className="px-3 py-1 rounded-full border-[3px] border-black font-nunito text-xs font-bold text-white"
            style={{ backgroundColor: difficultyColor }}
          >
            {difficultyLabel}
          </span>
          <span className="px-3 py-1 rounded-full border-[3px] border-black bg-purple-primary font-nunito text-xs font-bold text-white">
            {category}
          </span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="w-full flex border-[3px] border-black rounded-xl overflow-hidden">
        <button
          onClick={() => setActiveTab('learn')}
          className={`flex-1 py-2 font-nunito font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'learn'
              ? 'bg-white text-purple-dark border-b-[3px] border-purple-dark'
              : 'bg-purple-lighter text-purple-light'
          }`}
        >
          <BookOpen size={16} strokeWidth={3} />
          Learn
        </button>
        <button
          onClick={() => setActiveTab('hints')}
          className={`flex-1 py-2 font-nunito font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'hints'
              ? 'bg-white text-purple-dark border-b-[3px] border-purple-dark'
              : 'bg-purple-lighter text-purple-light'
          }`}
        >
          <Lightbulb size={16} strokeWidth={3} />
          Hints
        </button>
      </div>

      {/* Content */}
      <div className="w-full">
        {activeTab === 'learn' && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-4"
          >
            {/* Did You Know */}
            <div className="bg-blue-info/10 rounded-xl border-l-4 border-blue-info p-4">
              <h4 className="font-nunito font-bold text-sm text-purple-dark mb-2 flex items-center gap-2">
                <Sparkles size={16} strokeWidth={3} className="text-blue-info" />
                Did You Know?
              </h4>
              <ul className="space-y-1">
                {content.facts.map((fact, i) => (
                  <motion.li
                    key={i}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="font-nunito text-sm text-purple-dark flex items-start gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-info border border-black mt-1.5 flex-shrink-0" />
                    {fact}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Key Concepts */}
            <div className="bg-white rounded-xl border-[3px] border-black p-4">
              <h4 className="font-nunito font-bold text-sm text-purple-dark mb-2">
                Key Concepts
              </h4>
              <div className="flex flex-wrap gap-2">
                {content.concepts.map((concept, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className="px-3 py-1 bg-purple-lighter border-[2px] border-black rounded-full font-nunito text-xs font-semibold text-purple-dark"
                  >
                    {concept}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Real World Example */}
            <div className="bg-yellow-accent/20 rounded-xl border-l-4 border-yellow-accent p-4">
              <h4 className="font-nunito font-bold text-sm text-purple-dark mb-2">
                Real World Example
              </h4>
              <p className="font-nunito text-sm text-purple-dark leading-relaxed">
                {content.realWorld}
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'hints' && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-3"
          >
            {[1, 2, 3].map((hintNum) => (
              <motion.div
                key={hintNum}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: hintNum * 0.1 }}
                className="bg-purple-lighter rounded-xl border-[3px] border-black p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-purple-primary border-[3px] border-black flex items-center justify-center flex-shrink-0">
                  <Lock size={18} strokeWidth={3} className="text-white" />
                </div>
                <div>
                  <p className="font-nunito text-sm font-bold text-purple-dark">
                    Hint {hintNum}
                  </p>
                  <p className="font-nunito text-xs text-purple-light">
                    Unlock this hint during gameplay for 10 XP
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Coming Soon Message */}
      <div className="bg-purple-pale rounded-xl border-[3px] border-dashed border-purple-light p-4 text-center">
        <p className="font-nunito text-sm text-purple-dark">
          The full <strong>{gameTitle}</strong> simulation is coming soon!
        </p>
        <p className="font-nunito text-xs text-purple-light mt-1">
          Meanwhile, explore the learning materials above to prepare for this mission.
        </p>
      </div>
    </div>
  );
}
