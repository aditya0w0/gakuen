// Translations for the application
// Languages: English (en), Japanese (ja), Korean (ko), Indonesian (id)

export type Language = "en" | "ja" | "ko" | "id";

// Define the shape of translations
export interface Translations {
    appName: string;
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    submit: string;
    search: string;
    home: string;
    browse: string;
    classes: string;
    settings: string;
    dashboard: string;
    users: string;
    logout: string;
    login: string;
    landing: {
        tagline: string;
        title1: string;
        title2: string;
        description: string;
        getStarted: string;
        learnMore: string;
        activeLearners: string;
        expertCourses: string;
        successRate: string;
        whyChoose: string;
        whyDescription: string;
        startNow: string;
        joinThousands: string;
        startFree: string;
    };
    features: {
        expertContent: string;
        expertContentDesc: string;
        trackProgress: string;
        trackProgressDesc: string;
        community: string;
        communityDesc: string;
        certificates: string;
        certificatesDesc: string;
        adaptive: string;
        adaptiveDesc: string;
        career: string;
        careerDesc: string;
    };
    auth: {
        welcomeBack: string;
        createAccount: string;
        signInContinue: string;
        joinGakuen: string;
        email: string;
        password: string;
        fullName: string;
        signIn: string;
        signUp: string;
        noAccount: string;
        hasAccount: string;
        orContinue: string;
        signingIn: string;
        creatingAccount: string;
    };
    dash: {
        studentPortal: string;
        adminPortal: string;
    };
    // New: User Dashboard
    userDash: {
        welcomeBack: string;
        continueJourney: string;
        coursesEnrolled: string;
        hoursLearned: string;
        lessonsCompleted: string;
        dayStreak: string;
        continueLearning: string;
        recommendedForYou: string;
        aiPowered: string;
        browseAll: string;
        noRecommendations: string;
    };
    // New: Browse Page
    browsePage: {
        title: string;
        description: string;
        explore: string;
        searchPlaceholder: string;
        filters: string;
        all: string;
        noResults: string;
        clearFilters: string;
        findingCourses: string;
    };
    // New: AI
    ai: {
        notSureTitle: string;
        notSureDesc: string;
        askAi: string;
        thinking: string;
        aiSays: string;
        inputPlaceholder: string;
    };
    // New: Course
    course: {
        enroll: string;
        enrolled: string;
        progress: string;
        continueLearning: string;
        instructor: string;
        beginner: string;
        intermediate: string;
        advanced: string;
    };
    // New: Settings Page
    settingsPage: {
        title: string;
        description: string;
        profile: string;
        profilePicture: string;
        uploadAvatar: string;
        name: string;
        email: string;
        security: string;
        passwordEmail: string;
        changePassword: string;
        notifications: string;
        emailNotifications: string;
        courseUpdates: string;
        courseReminders: string;
        dailyReminders: string;
        achievements: string;
        badgesMilestones: string;
        dangerZone: string;
        deleteAccount: string;
        deleteWarning: string;
    };
    // New: My Classes
    myClasses: {
        title: string;
        subtitle: string;
        totalCourses: string;
        inProgress: string;
        completed: string;
        noCourses: string;
        startLearning: string;
        all: string;
    };
}

export const translations: Record<Language, Translations> = {
    en: {
        // Common
        appName: "Gakuen",
        loading: "Loading...",
        error: "Error",
        success: "Success",
        cancel: "Cancel",
        save: "Save",
        delete: "Delete",
        edit: "Edit",
        back: "Back",
        next: "Next",
        submit: "Submit",
        search: "Search",

        // Navigation
        home: "Home",
        browse: "Browse",
        classes: "Classes",
        settings: "Settings",
        dashboard: "Dashboard",
        users: "Users",
        logout: "Sign Out",
        login: "Sign In",

        // Landing Page
        landing: {
            tagline: "Transforming Education Through Technology",
            title1: "Learn Programming",
            title2: "The Smart Way",
            description: "Master in-demand skills with expert-crafted courses. Join thousands of learners building their dream careers.",
            getStarted: "Get Started",
            learnMore: "Learn More",
            activeLearners: "Active Learners",
            expertCourses: "Expert Courses",
            successRate: "Success Rate",
            whyChoose: "Why Choose Gakuen?",
            whyDescription: "Everything you need to accelerate your learning journey",
            startNow: "Start Now",
            joinThousands: "Join thousands of students already learning on Gakuen",
            startFree: "Start Free",
        },

        // Features
        features: {
            expertContent: "Expert-Crafted Content",
            expertContentDesc: "Learn from industry professionals with real-world experience.",
            trackProgress: "Track Your Progress",
            trackProgressDesc: "Monitor your learning journey with detailed analytics.",
            community: "Community Support",
            communityDesc: "Connect with fellow learners and grow together.",
            certificates: "Earn Certificates",
            certificatesDesc: "Receive recognized certificates upon completion.",
            adaptive: "Adaptive Learning",
            adaptiveDesc: "Personalized learning paths that adapt to your pace.",
            career: "Career Growth",
            careerDesc: "Build job-ready skills that employers are seeking.",
        },

        // Auth
        auth: {
            welcomeBack: "Welcome Back",
            createAccount: "Create Account",
            signInContinue: "Sign in to continue your journey",
            joinGakuen: "Join Gakuen to start learning",
            email: "Email Address",
            password: "Password",
            fullName: "Full Name",
            signIn: "Sign In",
            signUp: "Sign Up",
            noAccount: "Don't have an account?",
            hasAccount: "Already have an account?",
            orContinue: "Or continue with",
            signingIn: "Signing in...",
            creatingAccount: "Creating account...",
        },

        // Dashboard
        dash: {
            studentPortal: "Student Portal",
            adminPortal: "Admin Portal",
        },

        // User Dashboard
        userDash: {
            welcomeBack: "Welcome back",
            continueJourney: "Continue your learning journey",
            coursesEnrolled: "Courses Enrolled",
            hoursLearned: "Hours Learned",
            lessonsCompleted: "Lessons Completed",
            dayStreak: "Day Streak",
            continueLearning: "Continue Learning",
            recommendedForYou: "Recommended for You",
            aiPowered: "AI Powered",
            browseAll: "Browse All",
            noRecommendations: "No recommendations available yet. Start exploring courses!",
        },

        // Browse Page
        browsePage: {
            title: "Browse Courses",
            description: "Discover new skills and advance your career with our curated catalog.",
            explore: "Explore",
            searchPlaceholder: "Search for skills, topics...",
            filters: "Filters",
            all: "All",
            noResults: "No courses found",
            clearFilters: "Clear filters",
            findingCourses: "Finding the best courses for you...",
        },

        // AI
        ai: {
            notSureTitle: "Not sure what to pick?",
            notSureDesc: "Tell our AI advisor what you're interested in, and we'll find the perfect course for you.",
            askAi: "Ask AI",
            thinking: "Thinking...",
            aiSays: "AI says",
            inputPlaceholder: "e.g., I want to build a mobile app...",
        },

        // Course
        course: {
            enroll: "Enroll",
            enrolled: "Enrolled",
            progress: "Progress",
            continueLearning: "Continue Learning",
            instructor: "Instructor",
            beginner: "Beginner",
            intermediate: "Intermediate",
            advanced: "Advanced",
        },

        // Settings Page
        settingsPage: {
            title: "Settings",
            description: "Manage your account and preferences",
            profile: "Profile",
            profilePicture: "Profile Picture",
            uploadAvatar: "Click to upload a new avatar",
            name: "Name",
            email: "Email",
            security: "Security",
            passwordEmail: "Password & Email",
            changePassword: "Change your password or email address",
            notifications: "Notifications",
            emailNotifications: "Email Notifications",
            courseUpdates: "Course updates and announcements",
            courseReminders: "Course Reminders",
            dailyReminders: "Daily learning reminders",
            achievements: "Achievements",
            badgesMilestones: "Badges and milestones",
            dangerZone: "Danger Zone",
            deleteAccount: "Delete Account",
            deleteWarning: "Permanently delete your account and all data",
        },

        // My Classes
        myClasses: {
            title: "My Classes",
            subtitle: "Track your enrolled courses and progress",
            totalCourses: "Total Courses",
            inProgress: "In Progress",
            completed: "Completed",
            noCourses: "You haven't enrolled in any courses yet.",
            startLearning: "Start Learning",
            all: "All",
        },
    },

    ja: {
        // Common
        appName: "学園",
        loading: "読み込み中...",
        error: "エラー",
        success: "成功",
        cancel: "キャンセル",
        save: "保存",
        delete: "削除",
        edit: "編集",
        back: "戻る",
        next: "次へ",
        submit: "送信",
        search: "検索",

        // Navigation
        home: "ホーム",
        browse: "閲覧",
        classes: "クラス",
        settings: "設定",
        dashboard: "ダッシュボード",
        users: "ユーザー",
        logout: "ログアウト",
        login: "ログイン",

        // Landing Page
        landing: {
            tagline: "テクノロジーで教育を変革",
            title1: "プログラミングを学ぶ",
            title2: "スマートな方法で",
            description: "専門家が作成したコースでスキルを習得。キャリアを築く学習者に参加しましょう。",
            getStarted: "始める",
            learnMore: "詳細",
            activeLearners: "アクティブな学習者",
            expertCourses: "専門コース",
            successRate: "成功率",
            whyChoose: "なぜ学園を選ぶのか？",
            whyDescription: "学習を加速するために必要なすべて",
            startNow: "今すぐ始める",
            joinThousands: "すでに学園で学んでいる数千人の学生に参加",
            startFree: "無料で始める",
        },

        // Features
        features: {
            expertContent: "専門家コンテンツ",
            expertContentDesc: "実務経験を持つ業界専門家から学ぶ。",
            trackProgress: "進捗追跡",
            trackProgressDesc: "詳細な分析で学習を監視。",
            community: "コミュニティサポート",
            communityDesc: "仲間と繋がり、共に成長。",
            certificates: "認定証取得",
            certificatesDesc: "修了時に認定証を取得。",
            adaptive: "適応型学習",
            adaptiveDesc: "あなたのペースに合わせた学習パス。",
            career: "キャリア成長",
            careerDesc: "雇用者が求めるスキルを構築。",
        },

        // Auth
        auth: {
            welcomeBack: "おかえりなさい",
            createAccount: "アカウント作成",
            signInContinue: "サインインして続ける",
            joinGakuen: "学園に参加して学習を始める",
            email: "メールアドレス",
            password: "パスワード",
            fullName: "氏名",
            signIn: "サインイン",
            signUp: "サインアップ",
            noAccount: "アカウントをお持ちでない方",
            hasAccount: "アカウントをお持ちの方",
            orContinue: "または続ける",
            signingIn: "サインイン中...",
            creatingAccount: "アカウント作成中...",
        },

        // Dashboard
        dash: {
            studentPortal: "学生ポータル",
            adminPortal: "管理者ポータル",
        },

        // User Dashboard
        userDash: {
            welcomeBack: "おかえりなさい",
            continueJourney: "学習を続けましょう",
            coursesEnrolled: "登録コース",
            hoursLearned: "学習時間",
            lessonsCompleted: "完了レッスン",
            dayStreak: "連続日数",
            continueLearning: "学習を続ける",
            recommendedForYou: "おすすめ",
            aiPowered: "AI搭載",
            browseAll: "すべて見る",
            noRecommendations: "まだおすすめがありません。コースを探してみましょう！",
        },

        // Browse Page
        browsePage: {
            title: "コースを探す",
            description: "厳選されたカタログで新しいスキルを発見し、キャリアを向上させましょう。",
            explore: "探索",
            searchPlaceholder: "スキル、トピックを検索...",
            filters: "フィルター",
            all: "すべて",
            noResults: "コースが見つかりません",
            clearFilters: "フィルターをクリア",
            findingCourses: "最適なコースを探しています...",
        },

        // AI
        ai: {
            notSureTitle: "何を選べばいいかわからない？",
            notSureDesc: "AIアドバイザーに興味のあることを伝えてください。最適なコースを見つけます。",
            askAi: "AIに聞く",
            thinking: "考え中...",
            aiSays: "AIの回答",
            inputPlaceholder: "例：モバイルアプリを作りたい...",
        },

        // Course
        course: {
            enroll: "登録",
            enrolled: "登録済み",
            progress: "進捗",
            continueLearning: "学習を続ける",
            instructor: "講師",
            beginner: "初級",
            intermediate: "中級",
            advanced: "上級",
        },

        // Settings Page
        settingsPage: {
            title: "設定",
            description: "アカウントと設定を管理",
            profile: "プロフィール",
            profilePicture: "プロフィール写真",
            uploadAvatar: "クリックして新しいアバターをアップロード",
            name: "名前",
            email: "メール",
            security: "セキュリティ",
            passwordEmail: "パスワードとメール",
            changePassword: "パスワードまたはメールアドレスを変更",
            notifications: "通知",
            emailNotifications: "メール通知",
            courseUpdates: "コースの更新とお知らせ",
            courseReminders: "コースリマインダー",
            dailyReminders: "毎日の学習リマインダー",
            achievements: "実績",
            badgesMilestones: "バッジとマイルストーン",
            dangerZone: "危険ゾーン",
            deleteAccount: "アカウント削除",
            deleteWarning: "アカウントとすべてのデータを完全に削除",
        },

        // My Classes
        myClasses: {
            title: "マイクラス",
            subtitle: "登録コースと進捗を追跡",
            totalCourses: "合計コース",
            inProgress: "進行中",
            completed: "完了",
            noCourses: "まだコースに登録していません。",
            startLearning: "学習を始める",
            all: "すべて",
        },
    },

    ko: {
        // Common
        appName: "가쿠엔",
        loading: "로딩 중...",
        error: "오류",
        success: "성공",
        cancel: "취소",
        save: "저장",
        delete: "삭제",
        edit: "편집",
        back: "뒤로",
        next: "다음",
        submit: "제출",
        search: "검색",

        // Navigation
        home: "홈",
        browse: "탐색",
        classes: "수업",
        settings: "설정",
        dashboard: "대시보드",
        users: "사용자",
        logout: "로그아웃",
        login: "로그인",

        // Landing Page
        landing: {
            tagline: "기술로 교육을 혁신합니다",
            title1: "프로그래밍 배우기",
            title2: "스마트한 방법으로",
            description: "전문가가 만든 과정으로 기술을 마스터하세요. 꿈의 커리어를 만들어가는 학습자들과 함께하세요.",
            getStarted: "시작하기",
            learnMore: "자세히 알아보기",
            activeLearners: "활성 학습자",
            expertCourses: "전문 과정",
            successRate: "성공률",
            whyChoose: "왜 가쿠엔인가요?",
            whyDescription: "학습 여정을 가속화하는 데 필요한 모든 것",
            startNow: "지금 시작하세요",
            joinThousands: "이미 가쿠엔에서 학습하고 있는 수천 명의 학생들과 함께하세요",
            startFree: "무료로 시작하기",
        },

        // Features
        features: {
            expertContent: "전문 콘텐츠",
            expertContentDesc: "실무 경험이 있는 업계 전문가들로부터 배우세요.",
            trackProgress: "진행 상황 추적",
            trackProgressDesc: "상세한 분석으로 학습 여정을 모니터링하세요.",
            community: "커뮤니티 지원",
            communityDesc: "동료 학습자들과 연결하고 함께 성장하세요.",
            certificates: "인증서 획득",
            certificatesDesc: "수료 시 공인 인증서를 받으세요.",
            adaptive: "적응형 학습",
            adaptiveDesc: "페이스에 맞춰 조정되는 맞춤형 학습 경로.",
            career: "커리어 성장",
            careerDesc: "고용주가 찾는 실무 기술을 구축하세요.",
        },

        // Auth
        auth: {
            welcomeBack: "다시 오신 것을 환영합니다",
            createAccount: "계정 만들기",
            signInContinue: "로그인하여 여정을 계속하세요",
            joinGakuen: "가쿠엔에 가입하여 학습을 시작하세요",
            email: "이메일 주소",
            password: "비밀번호",
            fullName: "이름",
            signIn: "로그인",
            signUp: "가입하기",
            noAccount: "계정이 없으신가요?",
            hasAccount: "이미 계정이 있으신가요?",
            orContinue: "또는 계속하기",
            signingIn: "로그인 중...",
            creatingAccount: "계정 생성 중...",
        },

        // Dashboard
        dash: {
            studentPortal: "학생 포털",
            adminPortal: "관리자 포털",
        },

        // User Dashboard
        userDash: {
            welcomeBack: "다시 오신 것을 환영합니다",
            continueJourney: "학습 여정을 계속하세요",
            coursesEnrolled: "등록된 과정",
            hoursLearned: "학습 시간",
            lessonsCompleted: "완료된 레슨",
            dayStreak: "연속 일수",
            continueLearning: "학습 계속하기",
            recommendedForYou: "추천 과정",
            aiPowered: "AI 기반",
            browseAll: "모두 보기",
            noRecommendations: "아직 추천이 없습니다. 과정을 탐색해 보세요!",
        },

        // Browse Page
        browsePage: {
            title: "과정 탐색",
            description: "엄선된 카탈로그로 새로운 기술을 발견하고 커리어를 발전시키세요.",
            explore: "탐색",
            searchPlaceholder: "기술, 주제 검색...",
            filters: "필터",
            all: "전체",
            noResults: "과정을 찾을 수 없습니다",
            clearFilters: "필터 지우기",
            findingCourses: "최적의 과정을 찾고 있습니다...",
        },

        // AI
        ai: {
            notSureTitle: "무엇을 선택해야 할지 모르겠어요?",
            notSureDesc: "AI 어드바이저에게 관심사를 알려주세요. 완벽한 과정을 찾아드립니다.",
            askAi: "AI에게 물어보기",
            thinking: "생각 중...",
            aiSays: "AI의 답변",
            inputPlaceholder: "예: 모바일 앱을 만들고 싶어요...",
        },

        // Course
        course: {
            enroll: "등록",
            enrolled: "등록됨",
            progress: "진행률",
            continueLearning: "학습 계속하기",
            instructor: "강사",
            beginner: "초급",
            intermediate: "중급",
            advanced: "고급",
        },

        // Settings Page
        settingsPage: {
            title: "설정",
            description: "계정 및 환경설정 관리",
            profile: "프로필",
            profilePicture: "프로필 사진",
            uploadAvatar: "클릭하여 새 아바타 업로드",
            name: "이름",
            email: "이메일",
            security: "보안",
            passwordEmail: "비밀번호 및 이메일",
            changePassword: "비밀번호 또는 이메일 주소 변경",
            notifications: "알림",
            emailNotifications: "이메일 알림",
            courseUpdates: "과정 업데이트 및 공지",
            courseReminders: "과정 알림",
            dailyReminders: "매일 학습 알림",
            achievements: "업적",
            badgesMilestones: "배지 및 마일스톤",
            dangerZone: "위험 구역",
            deleteAccount: "계정 삭제",
            deleteWarning: "계정 및 모든 데이터 영구 삭제",
        },

        // My Classes
        myClasses: {
            title: "내 수업",
            subtitle: "등록된 과정 및 진행 상황 추적",
            totalCourses: "총 과정",
            inProgress: "진행 중",
            completed: "완료됨",
            noCourses: "아직 등록한 과정이 없습니다.",
            startLearning: "학습 시작",
            all: "전체",
        },
    },

    id: {
        // Common
        appName: "Gakuen",
        loading: "Memuat...",
        error: "Error",
        success: "Berhasil",
        cancel: "Batal",
        save: "Simpan",
        delete: "Hapus",
        edit: "Edit",
        back: "Kembali",
        next: "Selanjutnya",
        submit: "Kirim",
        search: "Cari",

        // Navigation
        home: "Beranda",
        browse: "Jelajahi",
        classes: "Kelas",
        settings: "Pengaturan",
        dashboard: "Dasbor",
        users: "Pengguna",
        logout: "Keluar",
        login: "Masuk",

        // Landing Page
        landing: {
            tagline: "Transformasi Pendidikan Melalui Teknologi",
            title1: "Belajar Programming",
            title2: "dengan Cara Cerdas",
            description: "Kuasai keterampilan dengan kursus yang dibuat oleh ahli. Bergabunglah dengan ribuan pelajar yang membangun karir impian.",
            getStarted: "Mulai Sekarang",
            learnMore: "Pelajari Lebih",
            activeLearners: "Pelajar Aktif",
            expertCourses: "Kursus Ahli",
            successRate: "Tingkat Keberhasilan",
            whyChoose: "Mengapa Pilih Gakuen?",
            whyDescription: "Semua yang Anda butuhkan untuk mempercepat perjalanan belajar",
            startNow: "Mulai Sekarang",
            joinThousands: "Bergabung dengan ribuan siswa yang sudah belajar di Gakuen",
            startFree: "Mulai Gratis",
        },

        // Features
        features: {
            expertContent: "Konten dari Ahli",
            expertContentDesc: "Belajar dari profesional industri dengan pengalaman nyata.",
            trackProgress: "Lacak Kemajuan",
            trackProgressDesc: "Pantau perjalanan belajar dengan analitik detail.",
            community: "Dukungan Komunitas",
            communityDesc: "Terhubung dengan sesama pelajar dan berkembang bersama.",
            certificates: "Dapatkan Sertifikat",
            certificatesDesc: "Terima sertifikat yang diakui setelah menyelesaikan.",
            adaptive: "Pembelajaran Adaptif",
            adaptiveDesc: "Jalur belajar yang menyesuaikan dengan kecepatan Anda.",
            career: "Pertumbuhan Karir",
            careerDesc: "Bangun keterampilan yang dicari oleh pemberi kerja.",
        },

        // Auth
        auth: {
            welcomeBack: "Selamat Datang Kembali",
            createAccount: "Buat Akun",
            signInContinue: "Masuk untuk melanjutkan perjalanan",
            joinGakuen: "Bergabung dengan Gakuen untuk mulai belajar",
            email: "Alamat Email",
            password: "Kata Sandi",
            fullName: "Nama Lengkap",
            signIn: "Masuk",
            signUp: "Daftar",
            noAccount: "Belum punya akun?",
            hasAccount: "Sudah punya akun?",
            orContinue: "Atau lanjutkan dengan",
            signingIn: "Sedang masuk...",
            creatingAccount: "Membuat akun...",
        },

        // Dashboard
        dash: {
            studentPortal: "Portal Siswa",
            adminPortal: "Portal Admin",
        },

        // User Dashboard
        userDash: {
            welcomeBack: "Selamat datang kembali",
            continueJourney: "Lanjutkan perjalanan belajar Anda",
            coursesEnrolled: "Kursus Terdaftar",
            hoursLearned: "Jam Belajar",
            lessonsCompleted: "Pelajaran Selesai",
            dayStreak: "Hari Berturut-turut",
            continueLearning: "Lanjutkan Belajar",
            recommendedForYou: "Rekomendasi untuk Anda",
            aiPowered: "Didukung AI",
            browseAll: "Lihat Semua",
            noRecommendations: "Belum ada rekomendasi. Mulai jelajahi kursus!",
        },

        // Browse Page
        browsePage: {
            title: "Jelajahi Kursus",
            description: "Temukan keterampilan baru dan kembangkan karir dengan katalog pilihan kami.",
            explore: "Jelajahi",
            searchPlaceholder: "Cari keterampilan, topik...",
            filters: "Filter",
            all: "Semua",
            noResults: "Tidak ada kursus ditemukan",
            clearFilters: "Hapus filter",
            findingCourses: "Mencari kursus terbaik untuk Anda...",
        },

        // AI
        ai: {
            notSureTitle: "Tidak yakin mau pilih apa?",
            notSureDesc: "Beritahu AI advisor apa yang Anda minati, dan kami akan menemukan kursus yang tepat untuk Anda.",
            askAi: "Tanya AI",
            thinking: "Berpikir...",
            aiSays: "AI berkata",
            inputPlaceholder: "contoh: Saya ingin membuat aplikasi mobile...",
        },

        // Course
        course: {
            enroll: "Daftar",
            enrolled: "Terdaftar",
            progress: "Kemajuan",
            continueLearning: "Lanjutkan Belajar",
            instructor: "Instruktur",
            beginner: "Pemula",
            intermediate: "Menengah",
            advanced: "Lanjutan",
        },

        // Settings Page
        settingsPage: {
            title: "Pengaturan",
            description: "Kelola akun dan preferensi Anda",
            profile: "Profil",
            profilePicture: "Foto Profil",
            uploadAvatar: "Klik untuk mengunggah avatar baru",
            name: "Nama",
            email: "Email",
            security: "Keamanan",
            passwordEmail: "Kata Sandi & Email",
            changePassword: "Ubah kata sandi atau alamat email",
            notifications: "Notifikasi",
            emailNotifications: "Notifikasi Email",
            courseUpdates: "Pembaruan dan pengumuman kursus",
            courseReminders: "Pengingat Kursus",
            dailyReminders: "Pengingat belajar harian",
            achievements: "Pencapaian",
            badgesMilestones: "Lencana dan pencapaian",
            dangerZone: "Zona Bahaya",
            deleteAccount: "Hapus Akun",
            deleteWarning: "Hapus akun dan semua data secara permanen",
        },

        // My Classes
        myClasses: {
            title: "Kelas Saya",
            subtitle: "Lacak kursus terdaftar dan kemajuan Anda",
            totalCourses: "Total Kursus",
            inProgress: "Sedang Berlangsung",
            completed: "Selesai",
            noCourses: "Anda belum mendaftar kursus apapun.",
            startLearning: "Mulai Belajar",
            all: "Semua",
        },
    },
};
