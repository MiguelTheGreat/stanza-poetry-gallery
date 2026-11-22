/**
 * Stanza. — Dual-Mode Data Store (Full-Stack Express API + Static GitHub Pages Fallback)
 * Allows the entire app (Shelf, Experience Mode, Gallery Mode, New Volumes, and
 * Shareable Verse Cards with Music) to work seamlessly on both GitHub Pages and Node/Express.
 */
(function () {
  const CUSTOM_COLLECTIONS_KEY = 'stanza_custom_collections_v1';
  const IS_LOCAL_API =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const BUILTIN_COLLECTION = {
    slug: 'cut-on-the-life-of-a-weeping-man',
    volume: 'VOL. 01',
    year: '2026',
    title: 'Cut on the Life of a Weeping Man',
    subtitle: '',
    epigraph: 'Words that were never meant to be songs.',
    author: 'Visitor',
    coverImage: '',
    accentColor: '#a67c52',
    ambientGlow:
      'radial-gradient(circle at 50% 45%, rgba(166, 124, 82, 0.28) 0%, rgba(196, 168, 134, 0.14) 45%, transparent 75%)',
    poemCount: 8,
    poems: [
      {
        slug: 'all-smiles-and-white-teeth',
        orderIndex: 1,
        indexLabel: '01 / 08',
        watermark: '01',
        title: 'All Smiles and White Teeth',
        subtitle: '',
        mood: '',
        accentHex: '#9c8a72',
        glow: 'radial-gradient(circle at 48% 46%, rgba(196, 178, 152, 0.30) 0%, rgba(214, 202, 184, 0.14) 42%, transparent 74%)',
        watercolorRgb: '156, 138, 114',
        stanzas: [
          [
            'It starts with a man, who, by all means,',
            'Believes that he is the greatest to live.',
            'A body to be dreamt of and a mind to be',
            'Jealous of, an impeccable piece of work.'
          ],
          [
            'Oh boy, is that what you think of you?',
            'Grab your toothbrush and toothpaste.',
            'You tell yourself, "Fuck, I have great teeth."',
            'Wipe your face with a towel, shave your face'
          ],
          [
            'You got the strength of 10 great men,',
            'You have the mind of 10 geniuses.',
            'You got the balls of 10 adult actors.',
            'Above all, you have the grit of 10 fucking plebs.'
          ],
          [
            'You think to yourself, "This interview\'s nothing!',
            'I\'ve conquered 20 countries before."',
            'Enter the conference room with your suit',
            'And tie properly adjusted and hair curled.'
          ],
          [
            'Without a moment\'s breath, you smiled.',
            'Smiled in front of 10 people.',
            'Making up lies more exuberant than the last.',
            '"Are they really believing me? What idiots!"'
          ],
          [
            'You exit out of the conference room,',
            'Feeling that your long sleeves are wet.',
            'Your heart is beating fast and you walk with haste.',
            'In your mind, "I\'m the greatest there\'s ever been!"'
          ]
        ]
      },
      {
        slug: 'once-in-a-subway-train',
        orderIndex: 2,
        indexLabel: '02 / 08',
        watermark: '02',
        title: 'Once in a Subway Train...',
        subtitle: '',
        mood: '',
        accentHex: '#6c859e',
        glow: 'radial-gradient(circle at 52% 45%, rgba(114, 146, 182, 0.28) 0%, rgba(178, 166, 188, 0.14) 44%, transparent 75%)',
        watercolorRgb: '108, 133, 158',
        stanzas: [
          [
            'In a near future, Manila would sprout',
            'With all kinds of transportation.',
            'A subway that was due for completion.',
            'A hallmark of the Philippines\' greatest project.'
          ],
          [
            'I passed the turnstile, scanning my card,',
            'And I waited for the train to arrive.',
            'You bought a ticket at the counter',
            'And you waited for your train to arrive.'
          ],
          [
            'I was without breath, for a moment.',
            'I gazed upon the sea of the crowd,',
            'Trying to find those dazzling clothes.',
            'Only to find that you were already gone.'
          ],
          [
            'All our days, we spent trying to meet each other\'s eyes.',
            'Days became weeks, weeks became months.',
            'Finally, we stood side by side.',
            'For the first time, we waited for the same train to arrive.'
          ],
          [
            'I stood in the middle section of the coach,',
            'You rested your head in the center of my chest.',
            'We vowed to share our secrets,',
            'Words that were never meant to be songs.'
          ],
          [
            'I felt the calm breath of your mouth,',
            'For once, our destination was all the same.',
            'We stepped out of the train, and you gave me your ticket,',
            'In a moment where our hands were intertwined.'
          ],
          [
            'We stopped and we looked at each other.',
            'You leaned in and our breaths became one.',
            'In a heartbeat, the subway started to crumble,',
            'You had suffered and I began to weep.'
          ]
        ]
      },
      {
        slug: 'test-papers',
        orderIndex: 3,
        indexLabel: '03 / 08',
        watermark: '03',
        title: 'Test Papers',
        subtitle: '',
        mood: '',
        accentHex: '#9e5a4c',
        glow: 'radial-gradient(circle at 50% 48%, rgba(188, 108, 92, 0.27) 0%, rgba(212, 168, 134, 0.14) 45%, transparent 75%)',
        watercolorRgb: '158, 90, 76',
        stanzas: [
          [
            'God, my performance is immaculate.',
            'Not a second wasted, not a minute burned.',
            'Precise, accurate, and always on the mark.',
            'That\'s what I tell myself when she hands it out.'
          ],
          [
            'A+, B-, C? What the fuck do those mean?',
            'I only know I did well,',
            'Even got the difficult question correct.',
            'That\'s what I tell myself when she yells my name.'
          ],
          [
            'You hate it when I try something new?',
            'What? It\'s a shortcut to the same answer?',
            'That\'s more than enough! It\'s just a test!',
            'That\'s what I tell myself when the paper comes early.'
          ],
          [
            'I am more than enough! You\'re lacking!',
            'Don\'t act like you didn\'t enjoy giving it out.',
            'Your look when I effortlessly filled it up.',
            'That\'s what I tell myself when you whisper to my ears'
          ],
          [
            'I AM THE FUCKING HORSE! Leave me out of it.',
            'Don\'t say I\'m at fault, I\'m the only one who',
            'Knows how to cater to your every test.',
            'That\'s what I\'ll forever tell myself, I\'m perfect!'
          ]
        ]
      },
      {
        slug: 'monsters-under-your-bed',
        orderIndex: 4,
        indexLabel: '04 / 08',
        watermark: '04',
        title: 'Monsters Under Your Bed',
        subtitle: '',
        mood: '',
        accentHex: '#6f7c66',
        glow: 'radial-gradient(circle at 46% 52%, rgba(124, 142, 112, 0.28) 0%, rgba(186, 152, 104, 0.15) 44%, transparent 75%)',
        watercolorRgb: '111, 124, 102',
        stanzas: [
          [
            'I used to dream of a place with no pain,',
            'No harm, and no anger. A space to freely',
            'Act on the will of my consciousness and to see',
            'Clarity that bathes the mud-choked roads.'
          ],
          [
            'Vines, cracks, smell of fire, seep into my senses.',
            'Can I see my way out of this?',
            'A house filled with joy and jubilee',
            'Transformed into toxic waste.'
          ],
          [
            'Two million once inhabited this place.',
            'Now, it\'s reduced to me and the lamp I carry.',
            'I move the vines out of the way,',
            'For the steps I am about to take.'
          ],
          [
            'Everything shakes in a continuous rattle.',
            'A noise creeps up from behind,',
            '"You are my prisoner, boy. You can\'t escape',
            'Me or the responsibility you once carried."'
          ],
          [
            'Don\'t remind me! Please, do not- cut.',
            'I try to fight back, but I can\'t escape it.',
            'An inevitability, in a desolate place like this.',
            'Uneven breathing, eyes furiously moving.'
          ],
          [
            '"Hey, Vince! Wake up! You\'re having a bad dream."',
            'She\'s actually a friend of mine, well,',
            'Friend is a term I\'d like to use.',
            'No, I\'m not okay. The rattling stops and the dreams fade away.'
          ]
        ]
      },
      {
        slug: 'omelette',
        orderIndex: 5,
        indexLabel: '05 / 08',
        watermark: '05',
        title: 'Omelette',
        subtitle: '',
        mood: '',
        accentHex: '#c48d46',
        glow: 'radial-gradient(circle at 50% 48%, rgba(226, 166, 76, 0.30) 0%, rgba(186, 152, 108, 0.14) 45%, transparent 75%)',
        watercolorRgb: '196, 141, 70',
        stanzas: [
          [
            'Ignore the endless plates in the sink,',
            'I never meant for you to see them.',
            'It\'s only for tonight and it\'s a mess, I know.',
            'Tomorrow, you\'ll see it\'s all in order.'
          ],
          [
            'I said that as you arrive with takeout',
            'And the sound of the paper bag clacks as it hits',
            'The surface of the table.',
            '"Are you watching those videos again?"'
          ],
          [
            'Watched Netflix and turned down the volume.',
            'We have sex in the living room, TV area.',
            'Hoping that you never see through this sorry confidence',
            'Or my inability to provide you with anything else.'
          ],
          [
            'I try and I really try.',
            'I wake up and cook you breakfast.',
            'Cleaned the table and threw the receipt from yesterday.',
            'Offer you a plate of eggs and rice.'
          ],
          [
            'I stand here with the scent still on the couch.',
            'I walk to the stove and turn the stove on.',
            'Beat the eggs, lightly cook the edges, master it',
            'So you won\'t look elsewhere when we\'re one again.'
          ],
          [
            'And I sit here, on the couch, saying to myself:',
            '"I\'ve come to a conclusion.',
            'The only food I can serve you',
            'Is nothing more than a scrambled egg."'
          ]
        ]
      },
      {
        slug: 'problem-too-big-for-a-mans-head',
        orderIndex: 6,
        indexLabel: '06 / 08',
        watermark: '06',
        title: 'Problem Too Big for a Man\'s Head',
        subtitle: '',
        mood: '',
        accentHex: '#a35049',
        glow: 'radial-gradient(circle at 48% 50%, rgba(176, 92, 86, 0.28) 0%, rgba(128, 154, 174, 0.16) 45%, transparent 75%)',
        watercolorRgb: '163, 80, 73',
        stanzas: [
          [
            '"This beach is from a memory of ours,',
            'one that cannot be removed or tainted.',
            'The times we built a sandcastle and',
            'a passerby destroyed what we built."'
          ],
          [
            'Sitting here with my arms hugging my knees,',
            'If only you knew how much of myself you carried.',
            'In moments where I began to lose myself,',
            'You were there to keep me afloat.'
          ],
          [
            'The beach where we used to play',
            'Is a far cry from what it once was.',
            'You told me, "Vince, get the fabric!',
            'We\'re building our fortress."'
          ],
          [
            'We waited for others to set up their own,',
            'Only for us to cry and scream',
            'Because they destroyed our turf.',
            'We could build it again, those were the days.'
          ],
          [
            'Proud of what we built,',
            'We showed it off to',
            'Anyone who would listen.',
            'Dylan... I\'ll bury the memories.'
          ],
          [
            'To protect you from seeing this side of me.',
            'To protect the ideas you shared.',
            'To protect what you hold dear.',
            'To protect the memories we created.'
          ],
          [
            '"A car crash in Quezon City has been reported.',
            'Victim: A young adult in red fabric.',
            'The police are currently identifying the body."',
            'Oh Dylan, if only we could rebuild that castle now.'
          ]
        ]
      },
      {
        slug: 'the-receipt-i-didnt-burn',
        orderIndex: 7,
        indexLabel: '07 / 08',
        watermark: '07',
        title: 'The Receipt I Didn\'t Burn',
        subtitle: '',
        mood: '',
        accentHex: '#7d8294',
        glow: 'radial-gradient(circle at 52% 46%, rgba(132, 140, 168, 0.27) 0%, rgba(198, 168, 134, 0.14) 44%, transparent 75%)',
        watercolorRgb: '125, 130, 148',
        stanzas: [
          [
            'I just woke up with another in my arms',
            'Tugging the pillows softly, she silences the alarm',
            'Held me tight and whispers to my ears:',
            '"Don\'t leave yet, I know you don\'t live near."'
          ],
          [
            'She\'s right, I\'m far from where I want to be.',
            '"Don\'t worry, I won\'t." I said, calmly.',
            'It\'s like that show in the television with the actor,',
            'How can he act convincingly? My face feels sore.'
          ],
          [
            'I\'m tired of putting up a front and calling myself okay.',
            'She snuggles tightly as I remember the receipt from that day.',
            'Minutes have gone by, I tell another lie.',
            '"I\'ll come back, baby. Please don\'t cry."'
          ],
          [
            'I have used that same lie four times this month.',
            'I always escape, I back out. God, I\'m a cunt.',
            'I returned to my home and turned on the lights.',
            'Put on the television and ooh, it\'s a bit too bright.'
          ],
          [
            'It\'s that actor I was talking about...',
            'Tell me, how do you keep them out?',
            'Put me in your shoes and let me feel happiness.',
            'Joy in acting and sleeping without sadness.'
          ],
          [
            'I stare blankly at the ceiling,',
            'Awaiting for answers, I look at the kitchen sink.',
            'In the trash, there formed a solution',
            'A receipt, a figure of my own vision.'
          ]
        ]
      },
      {
        slug: 'mirage',
        orderIndex: 8,
        indexLabel: '08 / 08',
        watermark: '08',
        title: 'Mirage',
        subtitle: '',
        mood: '',
        accentHex: '#c46c3a',
        glow: 'radial-gradient(circle at 50% 48%, rgba(218, 118, 58, 0.30) 0%, rgba(196, 152, 82, 0.16) 45%, transparent 75%)',
        watercolorRgb: '196, 108, 58',
        stanzas: [
          [
            'Forest fires travelled, from afar',
            'With throats itching and animals turned to ash.',
            'By its orange and raging fire,',
            'Cities turned yellow and noses accustomed to its smell.'
          ],
          [
            'I step inside the LRT, a normal day',
            'Carrying my bag with an empty lunch.',
            'I sit still as passengers leave the train,',
            'Realizing that many days have passed.'
          ],
          [
            'A silhouette talks, a man listens',
            'Music, shit, fucking poetic.',
            'I touch the window with my finger,',
            'Splitting the world, devoid of its laws.'
          ],
          [
            'Enter a world where the jeep stops for us',
            'And the coins I collect from your hands',
            'Become entangled with mine',
            'As we make out inside this bar.'
          ],
          [
            'I wake up with my shorts sticky,',
            'From the mirage I have seen and eaten with.',
            'To the forest fires of the south, I inhale',
            'Your scent, your clothes, and everything.'
          ],
          [
            'I don\'t mind being called crazy,',
            'If it\'s another chance to see you.',
            'Bleed me dry, run it deep, and choke me.',
            'This is my debt and you\'re getting dividends.'
          ]
        ]
      }
    ]
  };

  const BUILTIN_COLLECTION_2 = {
    slug: 'the-empress-and-the-warlord',
    volume: 'VOL. 02',
    year: '2026',
    title: 'The Empress and the Warlord',
    subtitle: '',
    epigraph: 'I sought blood, you sought love.',
    author: 'Visitor',
    coverImage: '',
    accentColor: '#9e5a4c',
    ambientGlow:
      'radial-gradient(circle at 50% 45%, rgba(158, 90, 76, 0.28) 0%, rgba(186, 148, 112, 0.14) 45%, transparent 75%)',
    poemCount: 3,
    poems: [
      {
        slug: 'for-you-my-empress',
        orderIndex: 1,
        indexLabel: '01 / 03',
        watermark: '01',
        title: 'Part 1: For You, My Empress',
        subtitle: '',
        mood: '',
        accentHex: '#9e5a4c',
        glow: 'radial-gradient(circle at 50% 46%, rgba(176, 98, 84, 0.28) 0%, rgba(206, 174, 138, 0.14) 44%, transparent 75%)',
        watercolorRgb: '158, 90, 76',
        stanzas: [
          [
            'A warlord cannot defeat an army all alone.',
            'An empress cannot love herself on her own.',
            'For he isn\'t able to handle the cries of the dead.',
            'For she can\'t share joy with someone filled with dread.'
          ],
          [
            'I sought blood, you sought love.',
            'The anger welled up inside me, I shoved.',
            'Giving me reason to further conquer lands.',
            'Presenting you our expansive barren sand.'
          ],
          [
            'Tireless days and nights spent building our empire,',
            'As the blood I desire turns into a love I admire.',
            'Dear empress, I can\'t see you from this distance!',
            'Can you see what I\'ve done for the empire\'s expanse?'
          ],
          [
            'Now, I stand atop the bodies of the dead and their flesh,',
            'Waiting for your return as we celebrate this mess.',
            'Tell me, my empress, where have you been?',
            'Did you go to a place left unseen?'
          ]
        ]
      },
      {
        slug: 'always-you-my-warlord',
        orderIndex: 2,
        indexLabel: '02 / 03',
        watermark: '02',
        title: 'Part 2: Always You, My Warlord',
        subtitle: '',
        mood: '',
        accentHex: '#a67c52',
        glow: 'radial-gradient(circle at 48% 48%, rgba(196, 156, 108, 0.28) 0%, rgba(212, 192, 162, 0.14) 44%, transparent 75%)',
        watercolorRgb: '166, 124, 82',
        stanzas: [
          [
            'I once walked the path that burned my feet,',
            'Just to stand where our eyes might meet.',
            'I waited for your return every passing day,',
            'Hoping your gaze would focus on me rather than somewhere astray.'
          ],
          [
            'Beloved, you need to know your presence is enough.',
            'I know war\'s your life and that change is tough.',
            'You worry that without your grandiose gifts',
            'My affection is one that you can\'t lift.'
          ],
          [
            'After all, the expanse wasn\'t what I want.',
            'I wish for the love only you could grant,',
            'Not the endless bodies you have slain.',
            'My mistake wasn\'t letting you know, causing great pain.'
          ],
          [
            'For now, I will stay right here in a place left unseen',
            'I shall wait for you, like it\'s always been.',
            'Until you realize what will forever be true:',
            'That you can change and I\'ll still choose you.'
          ]
        ]
      },
      {
        slug: 'an-empresss-blade-and-a-warlords-thorn',
        orderIndex: 3,
        indexLabel: '03 / 03',
        watermark: '03',
        title: 'Part 3: An Empress\'s Blade and A Warlord\'s Thorn',
        subtitle: '',
        mood: '',
        accentHex: '#7d524c',
        glow: 'radial-gradient(circle at 52% 48%, rgba(146, 84, 78, 0.28) 0%, rgba(176, 148, 134, 0.14) 44%, transparent 75%)',
        watercolorRgb: '125, 82, 76',
        stanzas: [
          [
            'Horrors unlike any other,',
            'A man\'s sin forgiven, never.',
            'Wandering desolate forests,',
            'Taming heart\'s endless unrest.'
          ],
          [
            'Forsake my life as punishment!',
            'Erase my love\'s resentment!',
            'Stop my core from ever beating',
            'And the souls\' continued screaming.'
          ],
          [
            'To appear in front of you, I did.',
            'Embrace the one I called beloved,',
            'Calm the waters of your teary eyes.',
            'Crying and waiting for your demise.'
          ],
          [
            'Judgements, forgiveness not mine to give',
            'Handed to the souls who once lived.',
            'I wanted to bring the peace you need',
            'But the joy you want, is to fall and bleed.'
          ],
          [
            'Thrust the sword, the one left to protect',
            'Myself, buried in your heart, direct.',
            '"You have my gratitude, my empress',
            'Appease the souls I laid to rest."'
          ]
        ]
      }
    ]
  };

  const BUILTIN_COLLECTION_3 = {
    slug: 'an-attempt-at-poetry-by-the-visitor',
    volume: 'VOL. 03',
    year: '2026',
    title: 'An Attempt at Poetry by the Visitor',
    subtitle: '',
    epigraph: 'Here I am, writing with a pen.',
    author: 'Visitor',
    coverImage: '',
    accentColor: '#7d8294',
    ambientGlow:
      'radial-gradient(circle at 50% 45%, rgba(125, 130, 148, 0.28) 0%, rgba(166, 124, 82, 0.14) 45%, transparent 75%)',
    poemCount: 10,
    poems: [
      {
        slug: 'untitled',
        orderIndex: 1,
        indexLabel: '01 / 10',
        watermark: '01',
        title: 'Untitled',
        subtitle: '',
        mood: '',
        accentHex: '#9c8a72',
        glow: 'radial-gradient(circle at 50% 46%, rgba(156, 138, 114, 0.28) 0%, rgba(206, 188, 164, 0.14) 44%, transparent 75%)',
        watercolorRgb: '156, 138, 114',
        stanzas: [
          [
            'I can\'t explain things clearly;',
            'The door of love awaits me;',
            'Unable to think freely;',
            'I want you to get out of my head quickly.'
          ],
          [
            'You do not know what is up;',
            'Making this all tough.',
            'I fell into your trap,',
            'Freeing the feelings I once cuffed.'
          ],
          [
            'Feeling like this, I should\'ve never let;',
            'This warm sensation I\'ll never forget;',
            'However, do not fret,',
            'Countermeasures are already set.'
          ],
          [
            'Oh, you are such a fine lady;',
            'But there\'s a catch for every pretty;',
            'Moving on is something I\'d plea,',
            'I\'m happy to be falling for someone like thee.'
          ]
        ]
      },
      {
        slug: 'just-my-thoughts',
        orderIndex: 2,
        indexLabel: '02 / 10',
        watermark: '02',
        title: 'Just my Thoughts',
        subtitle: '',
        mood: '',
        accentHex: '#a67c52',
        glow: 'radial-gradient(circle at 48% 48%, rgba(166, 124, 82, 0.28) 0%, rgba(208, 184, 152, 0.14) 44%, transparent 75%)',
        watercolorRgb: '166, 124, 82',
        stanzas: [
          [
            'A name like those beautiful flowers;',
            'You are all that mattered;',
            'A romance that will last forever;',
            'Yet, it is all just my thoughts.'
          ],
          [
            'Why did you suddenly become cold?',
            'Was it because I acted so bold?',
            'Or was it because you knew? or so I\'ve been told;',
            'Are these correct or are they just thoughts?'
          ],
          [
            'The greetings and all the reminders we made;',
            'Abruptly, they are starting to fade;',
            'Sometimes, it\'s best for feelings to be kept in the shade;',
            'But, all of these are just my thoughts.'
          ],
          [
            'You were the light that kept me smiling;',
            'Hopefully, you aren\'t the type to leave me crying;',
            'In a world full of romance, you were the one that caught me;',
            'But, hey! These are just my thoughts, in this world of reality.'
          ]
        ]
      },
      {
        slug: 'wandering-soul',
        orderIndex: 3,
        indexLabel: '03 / 10',
        watermark: '03',
        title: 'Wandering Soul',
        subtitle: '',
        mood: '',
        accentHex: '#6c859e',
        glow: 'radial-gradient(circle at 52% 46%, rgba(108, 133, 158, 0.28) 0%, rgba(176, 184, 196, 0.14) 44%, transparent 75%)',
        watercolorRgb: '108, 133, 158',
        stanzas: [
          [
            'Ahh, it\'s that time of the year again;',
            'Here I am, writing with a pen.',
            'A time full of fun and events;',
            'How I wish I could be with them.'
          ],
          [
            'Over on that corner, we see the couple;',
            'It\'s no wonder how they made each other fall.',
            'It\'s not luck they are together, it\'s fate.',
            'How I long for their relationship to belong to the greats.'
          ],
          [
            'On that side, there lies Kenneth;',
            'Wanting nothing but death.',
            'Blaming himself for something he hasn\'t done;',
            'His girl left him close to none.'
          ],
          [
            'I wish I could feel the same way as them;',
            'How I want to help someone like him.',
            'Oh yeah, I completely forgot;',
            'Being alive is something I am not.'
          ],
          [
            'The wandering soul that I am;',
            'I could still love like them.',
            'They may be unable to love or see me;',
            'However, I can still cherish myself truly.'
          ]
        ]
      },
      {
        slug: 'believed',
        orderIndex: 4,
        indexLabel: '04 / 10',
        watermark: '04',
        title: 'Believed',
        subtitle: '',
        mood: '',
        accentHex: '#9e5a4c',
        glow: 'radial-gradient(circle at 50% 48%, rgba(158, 90, 76, 0.28) 0%, rgba(196, 148, 134, 0.14) 44%, transparent 75%)',
        watercolorRgb: '158, 90, 76',
        stanzas: [
          [
            'A beautiful day had risen, the sound of birds chirping;',
            'A day so pretty, one could believe that this day is never ending.',
            'As the sun sets, people were singing and cheering;',
            'There, I saw a man smiling beautifully.'
          ],
          [
            'I can\'t help myself, but I\'m attracted to it;',
            'It\'s like this person always wanted us to meet.',
            'He grabbed my arm, and I knew it was over...',
            'It was not a smile that\'s beautiful, it\'s something sinister.'
          ],
          [
            'Broken as a plate, that\'s what I remembered;',
            'It was the only memory that never disappeared or faltered.',
            'This was what I was for my whole life,',
            'No matter how much I strived.'
          ],
          [
            'He has taken me into his shack;',
            'I wanted to scream as loud as a lightning that struck.',
            'To no avail, he covered my mouth with tape.',
            'Like a superhero who always puts on a cape.'
          ],
          [
            'Numerous times, I lived to tell a tale;',
            'No one believed what I began to tell.',
            'They believed that its significance was no more than a snail.',
            'Today, it changed as my blood began to fall.'
          ],
          [
            'If only someone had cared, someone had known;',
            'They may have felt the fear behind those moans.',
            'If only someone just... believed.',
            'Now, all that is left is a soul that no longer lives.'
          ]
        ]
      },
      {
        slug: 'that-warm-embrace',
        orderIndex: 5,
        indexLabel: '05 / 10',
        watermark: '05',
        title: 'That Warm Embrace...',
        subtitle: '',
        mood: '',
        accentHex: '#b37452',
        glow: 'radial-gradient(circle at 48% 50%, rgba(179, 116, 82, 0.28) 0%, rgba(212, 174, 142, 0.14) 44%, transparent 75%)',
        watercolorRgb: '179, 116, 82',
        stanzas: [
          [
            'I knew it was all too early,',
            'Early for everything to end.',
            'Yet, you were saying, you were broken by me?',
            'Oh, you know, your wounds only I can mend.'
          ],
          [
            'Accusing me of doing those things!',
            'If only you were more willing,',
            'Then, I wouldn\'t have broken that gaze.',
            'Setting up our relationship ablaze!'
          ],
          [
            'Your caress is something that I miss.',
            'I know you just need my apologies.',
            'Then, that would fix everything, right?',
            'To feel once more, the hug that made me bright.'
          ],
          [
            'Baby, I know it\'s my mistake...',
            'But, can you really blame me?',
            'I am ready to put everything at stake.',
            'You deserve better? Better, I can be.'
          ],
          [
            'So, please, even for just a day,',
            'Let me feel that warm embrace.',
            'I want your only to be me.',
            'Therefore, please, let me be...'
          ]
        ]
      },
      {
        slug: 'depths',
        orderIndex: 6,
        indexLabel: '06 / 10',
        watermark: '06',
        title: 'Depths',
        subtitle: '',
        mood: '',
        accentHex: '#5b7285',
        glow: 'radial-gradient(circle at 50% 50%, rgba(91, 114, 133, 0.28) 0%, rgba(146, 164, 178, 0.14) 44%, transparent 75%)',
        watercolorRgb: '91, 114, 133',
        stanzas: [
          [
            'Sinking, losing all hope,',
            'Longing, no way to cope.',
            'Wishing, life on a slope,',
            'Waiting, akin to a dope.'
          ],
          [
            'The gravity... it\'s dawning on me,',
            'Helpless, in the wide grand sea.',
            'The gravity... it\'s pulling me,',
            'Pulling me to face thee.'
          ],
          [
            'Deep, in too deep, no floating back,',
            'Scared... to confront the weight in my back.',
            'Darkness, the bleakness, it\'s pulling me back,',
            'Alone... no one to raise and lift my back.'
          ],
          [
            'Thou who destroyed myself,',
            'The depths of the sea I delved.',
            'I woke up finding light,',
            'Knowing my life has taken its flight.'
          ]
        ]
      },
      {
        slug: 'someone-like-the-stars',
        orderIndex: 7,
        indexLabel: '07 / 10',
        watermark: '07',
        title: 'Someone like the Stars',
        subtitle: '',
        mood: '',
        accentHex: '#c49a52',
        glow: 'radial-gradient(circle at 50% 45%, rgba(196, 154, 82, 0.28) 0%, rgba(218, 194, 146, 0.14) 44%, transparent 75%)',
        watercolorRgb: '196, 154, 82',
        stanzas: [
          [
            'Shine, you shine, among the never-ending sky.',
            'Beauty that everyone wants to become and try.',
            'No wonder when people gaze, they are left in awe.',
            'Trying to comprehend the alluring beauty they saw.'
          ],
          [
            'A thousand words can\'t describe your light.',
            'The radiance you bring illuminates the night.',
            'A twinkling and dazzling aura you emit.',
            'To the cold and frozen heart, you once again lit.'
          ],
          [
            'Far, you\'re far, from the relentless human reach.',
            'Defying the laws set, we fly and we will breach.',
            'To feel and embrace your phenomenal beauty.',
            'To make you feel our love, unrequited as it may be.'
          ],
          [
            'Always keep shining, as I admire you from afar.',
            'Unfailingly here to support as you are my star.',
            'To the cold and dark heart you broke, I stand.',
            'Someone like a star, a dazzling star that is grand.'
          ]
        ]
      },
      {
        slug: 'skipping-school',
        orderIndex: 8,
        indexLabel: '08 / 10',
        watermark: '08',
        title: 'Skipping School',
        subtitle: '',
        mood: '',
        accentHex: '#8a7a62',
        glow: 'radial-gradient(circle at 48% 48%, rgba(138, 122, 98, 0.28) 0%, rgba(194, 178, 154, 0.14) 44%, transparent 75%)',
        watercolorRgb: '138, 122, 98',
        stanzas: [
          [
            'It\'s late at night, writing my excuse letter to skip another day.',
            'My mother saw me struggling to pen the proper words.',
            'Lots of things to be written, but more things I can\'t say.',
            'Yet, your name appears first-never second nor third.'
          ],
          [
            'I skipped school that day, mailed in the letter to my teacher.',
            'Was it right? Was it the correct decision?',
            'Because, to learn is an opportunity to be better.',
            'But, I only want to grow to be the one you call your perfection.'
          ],
          [
            'Indeed, I was wrong. The next day, everyone had grown.',
            'Including you, the only field I want to spend my life with.',
            'You had flown. With someone, you had already flown.',
            'Saw you fly, with your gaze and my eyes that barely meet.'
          ],
          [
            'I regret skipping school that day.',
            'Every living being of me regrets skipping that chance.',
            'Had I gone, we would have flown together and in the air, we\'d dance.',
            'Now, all that remains is our past and the present that had gone astray.'
          ]
        ]
      },
      {
        slug: 'winters-end',
        orderIndex: 9,
        indexLabel: '09 / 10',
        watermark: '09',
        title: 'Winter\'s End',
        subtitle: '',
        mood: '',
        accentHex: '#7d8f82',
        glow: 'radial-gradient(circle at 52% 48%, rgba(125, 143, 130, 0.28) 0%, rgba(196, 174, 168, 0.14) 44%, transparent 75%)',
        watercolorRgb: '125, 143, 130',
        stanzas: [
          [
            'The winter breeze is quietly fading.',
            'The cold sensation and the chills it\'s giving',
            'Became an afterthought, as the ice and snow',
            'Slowly melt and bathe our home in its afterglow'
          ],
          [
            'Spring is coming, the sights of pink cherries',
            'And the warmer air is beginning to seize',
            'Capturing every beat of our hearts with solemn ease',
            'Cheeks flushing, eyes wandering, this feeling I\'ve missed'
          ],
          [
            'How I wish for this season to never end,',
            'But life will always be rough on its edges.',
            'That\'s why we make most of this time, fleeting at best.',
            'Because, these memories are what we\'ll need to make amends.'
          ],
          [
            'The last of the snow has melted,',
            'Together with the icy heart it protected.',
            'Thank God, the winter is over!',
            'I can now start with you, a life that will forever prosper.'
          ]
        ]
      },
      {
        slug: 'irony-of-it-all',
        orderIndex: 10,
        indexLabel: '10 / 10',
        watermark: '10',
        title: 'Irony of It All',
        subtitle: '',
        mood: '',
        accentHex: '#a35049',
        glow: 'radial-gradient(circle at 50% 48%, rgba(163, 80, 73, 0.28) 0%, rgba(186, 136, 122, 0.14) 44%, transparent 75%)',
        watercolorRgb: '163, 80, 73',
        stanzas: [
          [
            'Walls. Walls. Walls. They\'re closing in. Closing in.',
            'The sirens, the police, I\'m running... panting.',
            'Damn it, it\'s the edge of the building!',
            '"Come on, tell me is this all you can bring?!"'
          ],
          [
            'I once knew a friend, he was a good one.',
            'He spoke of the truth, behind all the jokes.',
            'For saying it, there came the smell of gun smoke.',
            'Fuck! My good friend... he\'s done, he\'s gone...'
          ],
          [
            'That\'s what you do best... "ordered" killing,',
            'The past tells us everything!',
            'You say, "you must take accountability!"',
            'But we know, all you want is impunity.'
          ],
          [
            'Your choices resulted in what\'s rotting!',
            'You speak of wanting the truth, but when one spoke of it,',
            'You silenced him, and when another starts speaking,',
            'You kill them, good God, the irony of it!'
          ]
        ]
      }
    ]
  };

  const BUILTIN_COLLECTIONS = [BUILTIN_COLLECTION, BUILTIN_COLLECTION_2, BUILTIN_COLLECTION_3];

  function slugify(text) {
    return (
      String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `vol-${Date.now().toString(36)}`
    );
  }

  function loadCustomCollections() {
    try {
      const list = JSON.parse(localStorage.getItem(CUSTOM_COLLECTIONS_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function saveCustomCollections(list) {
    try {
      localStorage.setItem(CUSTOM_COLLECTIONS_KEY, JSON.stringify(list));
    } catch {}
  }

  function getStaticCollections() {
    return [...BUILTIN_COLLECTIONS, ...loadCustomCollections()];
  }

  function encodeLines(lines) {
    const json = JSON.stringify(lines.slice(0, 4));
    const bytes = new TextEncoder().encode(json);
    let bin = '';
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodeLines(encoded) {
    try {
      const padded = encoded.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((encoded.length + 3) % 4);
      const bin = atob(padded);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      const parsed = JSON.parse(new TextDecoder().decode(bytes));
      return Array.isArray(parsed) ? parsed.slice(0, 4) : [];
    } catch {
      return [];
    }
  }

  function normalizeCoverPath(col) {
    if (!col) return col;
    if (col.coverImage && col.coverImage.startsWith('/assets/')) {
      col.coverImage = col.coverImage.slice(1);
    }
    return col;
  }

  async function getCollections() {
    if (IS_LOCAL_API) {
      try {
        const res = await fetch('api/collections');
        if (res.ok) {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              return data.map(normalizeCoverPath);
            }
          }
        }
      } catch {}
    }
    return getStaticCollections();
  }

  async function getCollection(slug) {
    if (IS_LOCAL_API) {
      try {
        const res = await fetch(`api/collections/${encodeURIComponent(slug)}`);
        if (res.ok) {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            return normalizeCoverPath(await res.json());
          }
        }
      } catch {}
    }
    const all = getStaticCollections();
    return all.find((c) => c.slug === slug) || BUILTIN_COLLECTION;
  }

  async function createCollection({ title, subtitle, epigraph, poems }) {
    if (IS_LOCAL_API) {
      try {
        const res = await fetch('api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, subtitle, epigraph, poems })
        });
        if (res.ok) return await res.json();
      } catch {}
    }

    // Static GitHub Pages fallback (localStorage)
    const custom = loadCustomCollections();
    const volNum = String(custom.length + BUILTIN_COLLECTIONS.length + 1).padStart(2, '0');
    const slug = slugify(title);
    const ambientGlow =
      'radial-gradient(circle at 50% 45%, rgba(166, 124, 82, 0.28) 0%, rgba(196, 168, 134, 0.14) 45%, transparent 75%)';

    const formattedPoems = (poems || []).map((p, idx) => {
      const stanzas = String(p.body || '')
        .trim()
        .split(/\n\s*\n/)
        .map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean))
        .filter((b) => b.length > 0);
      const pad = (n) => String(n).padStart(2, '0');
      return {
        slug: slugify(p.title || `poem-${idx + 1}`),
        orderIndex: idx + 1,
        indexLabel: `${pad(idx + 1)} / ${pad(poems.length)}`,
        watermark: pad(idx + 1),
        title: p.title || `Untitled ${idx + 1}`,
        subtitle: p.subtitle || `Study ${idx + 1}`,
        mood: '',
        accentHex: '#a67c52',
        glow: ambientGlow,
        watercolorRgb: '166, 124, 82',
        stanzas
      };
    });

    const newCol = {
      slug,
      volume: `VOL. ${volNum}`,
      year: String(new Date().getFullYear()),
      title,
      subtitle: subtitle || 'Original Poetry Collection',
      epigraph: epigraph || '',
      author: 'Visitor',
      coverImage: '',
      accentColor: '#a67c52',
      ambientGlow,
      poemCount: formattedPoems.length,
      poems: formattedPoems
    };
    custom.push(newCol);
    saveCustomCollections(custom);
    return { slug, volume: newCol.volume };
  }

  const THEME_KEY = 'stanza_theme_v1';
  const PROGRESS_KEY = 'stanza_last_read_v1';
  const NOTES_KEY = 'stanza_poem_notes_v1';

  const BUILTIN_COLLECTION_SLUGS = new Set(BUILTIN_COLLECTIONS.map((c) => c.slug));
  const BUILTIN_POEM_SLUGS = new Set(BUILTIN_COLLECTIONS.flatMap((c) => c.poems.map((p) => p.slug)));

  async function createShareUrl({
    collectionSlug,
    poemSlug,
    lines,
    cardStyle,
    showTitle,
    musicCode,
    highlightIndex = -1
  }) {
    if (IS_LOCAL_API) {
      try {
        const res = await fetch('api/shares', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collectionSlug, poemSlug, lines, cardStyle, showTitle, musicCode })
        });
        if (res.ok) {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const data = await res.json();
            if (data && data.path) {
              return `${window.location.origin}${data.path}`;
            }
          }
        }
      } catch {}
    }

    // Static GitHub Pages URL — uses per-poem share/<slug>.html for poem-specific Etched OG previews!
    const baseDir = window.location.href.split('?')[0].split('#')[0].replace(/\/[^/]*$/, '/');
    const targetPage =
      BUILTIN_COLLECTION_SLUGS.has(collectionSlug) && BUILTIN_POEM_SLUGS.has(poemSlug)
        ? `share/${poemSlug}.html`
        : 'gallery.html';
    const url = new URL(targetPage, baseDir);
    url.searchParams.set('share', '1');
    url.searchParams.set('col', collectionSlug);
    url.searchParams.set('poem', poemSlug);
    url.searchParams.set('card', cardStyle || 'etched');
    url.searchParams.set('title', showTitle ? '1' : '0');
    if (highlightIndex >= 0 && highlightIndex < 4) {
      url.searchParams.set('hl', String(highlightIndex));
    }
    if (musicCode) url.searchParams.set('music', musicCode);
    url.searchParams.set('lines', encodeLines(lines));
    return url.toString();
  }

  async function resolveShareFromLocation() {
    // 1. Check full-stack /share/:id route
    const pathMatch = window.location.pathname.match(/\/share\/([a-zA-Z0-9_-]+)$/);
    if (pathMatch && !pathMatch[1].endsWith('.html')) {
      try {
        const res = await fetch(`/api/shares/${encodeURIComponent(pathMatch[1])}`);
        if (res.ok) return await res.json();
      } catch {}
    }

    // 2. Check static GitHub Pages query-param share URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('share') !== '1') return null;

    const colSlug = params.get('col') || BUILTIN_COLLECTION.slug;
    const poemSlug = params.get('poem') || BUILTIN_COLLECTION.poems[0].slug;
    const col = await getCollection(colSlug);
    const poem = (col.poems || []).find((p) => p.slug === poemSlug) || col.poems[0];
    const lines = decodeLines(params.get('lines') || '');
    const hlRaw = params.get('hl');
    const highlightIndex = hlRaw !== null && hlRaw !== '' ? parseInt(hlRaw, 10) : -1;

    return {
      collectionSlug: col.slug,
      poemSlug: poem.slug,
      lines: lines.length > 0 ? lines : (poem.stanzas[0] || []).slice(0, 4),
      cardStyle: params.get('card') || 'etched',
      showTitle: params.get('title') !== '0',
      musicCode: params.get('music') || '',
      highlightIndex: Number.isNaN(highlightIndex) ? -1 : highlightIndex,
      collection: col,
      poem
    };
  }

  // Theme persistence (Light Paper / Night Lamp)
  function applySavedTheme() {
    let saved = 'light';
    try { saved = localStorage.getItem(THEME_KEY) || 'light'; } catch {}
    document.documentElement.setAttribute('data-theme', saved);
    return saved;
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    return next;
  }

  function getLastRead() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null'); } catch { return null; }
  }

  function saveLastRead(info) {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(info)); } catch {}
  }

  function getPoemNote(poemKey) {
    try {
      const map = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
      return map[poemKey] || '';
    } catch { return ''; }
  }

  function savePoemNote(poemKey, text) {
    try {
      const map = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
      if (text && text.trim()) map[poemKey] = text.trim();
      else delete map[poemKey];
      localStorage.setItem(NOTES_KEY, JSON.stringify(map));
    } catch {}
  }

  applySavedTheme();

  window.StanzaStore = {
    DEFAULT_SLUG: BUILTIN_COLLECTION.slug,
    getCollections,
    getCollection,
    createCollection,
    createShareUrl,
    resolveShareFromLocation,
    applySavedTheme,
    toggleTheme,
    getLastRead,
    saveLastRead,
    getPoemNote,
    savePoemNote
  };
})();
