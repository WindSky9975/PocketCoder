export const SUPPORTED_LOCALES = ["zh-CN", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

type RouteCardCopy = {
  href: string;
  title: string;
  description: string;
};

type StepCopy = {
  title: string;
  description: string;
};

type SessionPreviewCopy = {
  sessionId: string;
  title: string;
  status: string;
  latency: string;
  summary: string;
  tone: "live" | "warn" | "default";
};

type FactCopy = {
  label: string;
  value: string;
};

export interface Messages {
  common: {
    brand: string;
    brandTitle: string;
    languageLabel: string;
    localeNames: Record<Locale, string>;
    noActivityYet: string;
    waitingPairedDevice: string;
  };
  nav: {
    ariaLabel: string;
    pair: string;
    sessions: string;
    recovery: string;
  };
  home: {
    eyebrow: string;
    title: string;
    lede: string;
    primaryAction: string;
    secondaryAction: string;
    routeMapEyebrow: string;
    routeMapTitle: string;
    routeMapSubtitle: string;
    routes: RouteCardCopy[];
    architectureEyebrow: string;
    architectureTitle: string;
    principles: string[];
  };
  pairing: {
    heroEyebrow: string;
    heroTitle: string;
    heroLede: string;
    chips: string[];
    formEyebrow: string;
    formTitle: string;
    formSubtitle: string;
    relayOriginLabel: string;
    relayOriginPlaceholder: string;
    deviceNameLabel: string;
    deviceNameDefault: string;
    deviceNamePlaceholder: string;
    tokenLabel: string;
    tokenPlaceholder: string;
    submitIdle: string;
    submitSubmitting: string;
    openSessions: string;
    helperText: string;
    resultEyebrow: string;
    resultTitle: string;
    browserDeviceLabel: string;
    desktopDeviceLabel: string;
    relayOriginResultLabel: string;
    registeredAtLabel: string;
    continueToSessions: string;
    flowEyebrow: string;
    flowTitle: string;
    steps: StepCopy[];
    guardrailsEyebrow: string;
    guardrailsTitle: string;
    notes: string[];
  };
  sessions: {
    heroEyebrow: string;
    heroTitle: string;
    heroLede: string;
    overviewEyebrow: string;
    overviewTitle: string;
    openDetail: string;
    mockSessions: SessionPreviewCopy[];
  };
  storedDevice: {
    eyebrow: string;
    checking: string;
    emptyTitle: string;
    emptyDescription: string;
    pairPhone: string;
    sectionEyebrow: string;
    sectionTitle: string;
    deviceId: string;
    relayOrigin: string;
    pairedAt: string;
    refreshPairing: string;
    forgetPairing: string;
  };
  sessionDetail: {
    heroEyebrow: string;
    heroLede: string;
    missingPairingLede: string;
    missingPairingTitle: string;
    missingPairingDescription: string;
    goToPair: string;
    backToSessions: string;
    stateEyebrow: string;
    lastActivityLabel: string;
    relayOriginLabel: string;
    returnControl: string;
    interruptSession: string;
    interruptReason: string;
    outputEyebrow: string;
    outputTitle: string;
    outputNote: string;
    outputAriaLabel: string;
    approvalsEyebrow: string;
    noApprovals: string;
    boundariesEyebrow: string;
    boundariesTitle: string;
    promptLabel: string;
    promptPlaceholder: string;
    sendPrompt: string;
    currentTaskWaitingSummary: string;
    currentTaskConnected: string;
    outputWaiting: string;
    outputSubscribed: (sessionId: string) => string;
    outputStateReason: (reason: string) => string;
    outputPromptQueued: (prompt: string) => string;
    outputApprovalDecision: (approvalId: string, decisionLabel: string) => string;
    outputResumeControl: string;
    outputInterrupt: string;
    facts: FactCopy[];
  };
  approval: {
    eyebrow: string;
    approvalId: string;
    issuedAt: string;
    allow: string;
    deny: string;
  };
  connectionError: {
    eyebrow: string;
    title: string;
    lede: string;
    retry: string;
    openPairing: string;
    recoveryEyebrow: string;
    recoveryTitle: string;
    steps: string[];
  };
  statuses: {
    session: Record<
      "idle" | "running" | "waiting_input" | "waiting_approval" | "error" | "disconnected",
      string
    >;
    connection: Record<"loading" | "missing_pairing" | "connecting" | "connected" | "error", string>;
    stream: Record<"stdout" | "stderr", string>;
    decision: Record<"allow" | "deny", string>;
  };
  errors: {
    fetchUnavailable: string;
    websocketUnavailable: string;
    browserRelayNotConnected: string;
    relayNotReady: string;
    relayConnectFailed: string;
    relayCommandFailed: string;
    pairingFailed: string;
    pairingFailedWithStatus: (status: string) => string;
  };
}

function defineMessages(messages: Messages): Messages {
  return messages;
}

const zhCN = defineMessages({
  common: {
    brand: "PocketCoder",
    brandTitle: "手机优先的编码控制台",
    languageLabel: "语言",
    localeNames: {
      "zh-CN": "中文",
      en: "English",
    },
    noActivityYet: "暂未收到活动",
    waitingPairedDevice: "等待已配对设备",
  },
  nav: {
    ariaLabel: "主导航",
    pair: "配对",
    sessions: "会话",
    recovery: "恢复",
  },
  home: {
    eyebrow: "V1 Web 外壳",
    title: "先完成配对，再清晰查看输出，必要时明确交还控制权。",
    lede:
      "这个 Web 外壳让浏览器只专注手机端会话体验，更深层的传输、协议和桌面职责继续留在页面层之外。",
    primaryAction: "开始配对",
    secondaryAction: "查看会话",
    routeMapEyebrow: "路线图",
    routeMapTitle: "PocketCoder V1 固定页面",
    routeMapSubtitle:
      "根路由可以承担导览职责，但核心流程仍然锚定在配对、会话列表、会话详情和恢复页面。",
    routes: [
      {
        href: "/pair",
        title: "配对设备",
        description: "打开配对入口，同时继续把密钥交换和存储策略留在路由层之外。",
      },
      {
        href: "/sessions",
        title: "查看实时会话",
        description: "浏览活动中或排队中的编码会话，并保持手机端可读的状态摘要。",
      },
      {
        href: "/connection-error",
        title: "处理连接恢复",
        description: "让连接降级后的恢复路径在小屏上也保持清晰、可执行。",
      },
    ],
    architectureEyebrow: "架构",
    architectureTitle: "高内聚，低耦合",
    principles: [
      "让 App Router 页面保持轻量，只负责组合和导航。",
      "把协议、实时连接、加密和本地存储都收敛到各自边界。",
      "从第一天起就保留 PWA 可安装能力，而不是后期再补。",
    ],
  },
  pairing: {
    heroEyebrow: "设备配对",
    heroTitle: "为当前手机建立可信终端身份。",
    heroLede:
      "页面只负责配对体验本身，Relay 请求、浏览器密钥占位和本地配对缓存继续由功能层与浏览器边界处理。",
    chips: ["HTTP 配对初始化", "浏览器密钥占位", "本地设备缓存"],
    formEyebrow: "开始配对",
    formTitle: "把这台手机绑定到桌面 Relay 身份",
    formSubtitle:
      "输入 `agentd auth` 生成的 Relay 地址和一次性令牌，等待 Relay 确认后再把浏览器设备信息存到本地。",
    relayOriginLabel: "Relay 地址",
    relayOriginPlaceholder: "https://relay.example.com",
    deviceNameLabel: "设备名称",
    deviceNameDefault: "PocketCoder 手机端",
    deviceNamePlaceholder: "PocketCoder 手机端",
    tokenLabel: "配对令牌",
    tokenPlaceholder: "pair.v1.xxxxx",
    submitIdle: "配对此设备",
    submitSubmitting: "配对中...",
    openSessions: "打开会话列表",
    helperText:
      "浏览器配对信息只通过 `lib/storage` 存储，更完整的 E2EE 密钥生命周期会在后续安全加固阶段补上。",
    resultEyebrow: "配对结果",
    resultTitle: "浏览器设备已注册",
    browserDeviceLabel: "浏览器设备",
    desktopDeviceLabel: "桌面设备",
    relayOriginResultLabel: "Relay 地址",
    registeredAtLabel: "注册时间",
    continueToSessions: "继续前往会话",
    flowEyebrow: "流程",
    flowTitle: "配对功能负责协调的步骤",
    steps: [
      {
        title: "确认配对准备状态",
        description: "确认手机已在线、已登录，并准备好与桌面端建立绑定关系。",
      },
      {
        title: "输入或扫描设备令牌",
        description: "在功能壳里处理令牌输入，同时继续把密钥逻辑隔离在浏览器边界之后。",
      },
      {
        title: "保存已配对身份",
        description: "只有 Relay 接受配对流程后，才把浏览器设备记录安全保存在本地。",
      },
    ],
    guardrailsEyebrow: "边界守护",
    guardrailsTitle: "保持功能边界清晰",
    notes: [
      "共享协议结构仍然只定义在 `@pocketcoder/protocol` 中。",
      "页面壳把请求、密钥和存储职责继续委派给 feature 或 lib 边界。",
      "配对成功后，会话页就可以继续建立实时订阅。",
    ],
  },
  sessions: {
    heroEyebrow: "会话列表",
    heroTitle: "在手机上查看会话队列，也不丢上下文。",
    heroLede:
      "这个列表页只负责摘要、配对状态和导航。实时订阅和回放行为仍然收敛在 feature 或 lib 边界中。",
    overviewEyebrow: "概览",
    overviewTitle: "当前桌面会话",
    openDetail: "查看详情",
    mockSessions: [
      {
        sessionId: "sess-live-241",
        title: "重构桌面配对握手",
        status: "进行中",
        latency: "Relay 往返 42 ms",
        summary: "实时输出正在持续流动，审批请求可能会随时到达。",
        tone: "live",
      },
      {
        sessionId: "sess-idle-118",
        title: "收紧 Relay 传输边界",
        status: "空闲",
        latency: "等待重新连接",
        summary: "浏览器外壳需要把状态讲清楚，但不直接持有重连内部实现。",
        tone: "default",
      },
      {
        sessionId: "sess-review-309",
        title: "审查工作区引导文件",
        status: "评审中",
        latency: "本地缓存已预热",
        summary: "通过 feature 组合展示最近活动、健康状态和审批快照。",
        tone: "warn",
      },
    ],
  },
  storedDevice: {
    eyebrow: "配对缓存",
    checking: "正在检查浏览器本地是否已经存在配对设备...",
    emptyTitle: "当前还没有已配对的浏览器设备",
    emptyDescription: "先完成手机配对，之后会话详情页才能使用已注册的浏览器设备标识建立 Relay 订阅。",
    pairPhone: "立即配对此手机",
    sectionEyebrow: "已配对浏览器设备",
    sectionTitle: "本地 Relay 身份已就绪",
    deviceId: "设备 ID",
    relayOrigin: "Relay 地址",
    pairedAt: "配对时间",
    refreshPairing: "重新配对",
    forgetPairing: "清除本地配对",
  },
  sessionDetail: {
    heroEyebrow: "会话详情",
    heroLede:
      "功能壳负责订阅建立、指令发送、审批响应和显式交还控制权，路由层继续保持只负责组合。",
    missingPairingLede: "当前路由已经准备好建立实时订阅，但浏览器本地还没有已配对设备标识。",
    missingPairingTitle: "先完成手机配对，再订阅会话",
    missingPairingDescription:
      "会话详情页只会使用已配对的浏览器身份接入 Relay WebSocket。请先从配对页开始，再返回这里。",
    goToPair: "前往配对页",
    backToSessions: "返回会话列表",
    stateEyebrow: "会话状态",
    lastActivityLabel: "最近活动",
    relayOriginLabel: "Relay 地址",
    returnControl: "将控制权交回桌面端",
    interruptSession: "中断当前会话",
    interruptReason: "手机端操作员发起中断",
    outputEyebrow: "实时输出",
    outputTitle: "流式输出外壳",
    outputNote: "传输职责仍然位于 `lib/realtime`，功能层只负责把协议包渲染成适合手机阅读的输出流。",
    outputAriaLabel: "会话输出流",
    approvalsEyebrow: "审批",
    noApprovals: "当前浏览器还没有待处理的审批请求。桌面端一旦暂停等待审批，请求就会出现在这里。",
    boundariesEyebrow: "边界",
    boundariesTitle: "哪些职责不会进入页面层",
    promptLabel: "为桌面会话排队下一条指令。",
    promptPlaceholder: "让桌面端继续检查下一个文件……",
    sendPrompt: "发送指令",
    currentTaskWaitingSummary: "等待 Relay 返回首个会话摘要。",
    currentTaskConnected: "桌面会话已连接。",
    outputWaiting: "[浏览器] 等待 Relay 订阅...",
    outputSubscribed: (sessionId: string) => `[浏览器] 已订阅 ${sessionId}`,
    outputStateReason: (reason: string) => `[状态] ${reason}`,
    outputPromptQueued: (prompt: string) => `[浏览器] 已排队指令：${prompt}`,
    outputApprovalDecision: (approvalId: string, decisionLabel: string) =>
      `[浏览器] 审批 ${approvalId} -> ${decisionLabel}`,
    outputResumeControl: "[浏览器] 已请求将控制权交回桌面端",
    outputInterrupt: "[浏览器] 已请求中断当前会话",
    facts: [
      { label: "执行归属", value: "桌面端仍然是会话执行的真实来源" },
      { label: "实时通道", value: "WebSocket 输出流只能经由 `lib/realtime` 进入" },
      { label: "本地存储", value: "会话提示信息只能通过 `lib/storage` 持久化" },
      { label: "协议契约", value: "共享类型只来自 `@pocketcoder/protocol`" },
    ],
  },
  approval: {
    eyebrow: "审批请求",
    approvalId: "审批 ID",
    issuedAt: "发起时间",
    allow: "允许",
    deny: "拒绝",
  },
  connectionError: {
    eyebrow: "连接异常",
    title: "实时链路降级时，也要把恢复路径说清楚。",
    lede: "这个页面负责解释当前故障、给出下一步安全动作，并避免把传输重连细节塞进页面组件。",
    retry: "重试连接",
    openPairing: "打开配对页",
    recoveryEyebrow: "恢复",
    recoveryTitle: "建议的下一步操作",
    steps: [
      "先检查桌面端与 Relay 的连接是否仍然存活。",
      "通过实时连接边界重新尝试 WebSocket 订阅。",
      "优先使用已配对身份重新连接，而不是重新跑完整配对流程。",
      "只有当手机端已经把降级状态表达清楚时，才升级到桌面端恢复手段。",
    ],
  },
  statuses: {
    session: {
      idle: "空闲",
      running: "运行中",
      waiting_input: "等待输入",
      waiting_approval: "等待审批",
      error: "错误",
      disconnected: "已断开",
    },
    connection: {
      loading: "加载中",
      missing_pairing: "未配对",
      connecting: "连接中",
      connected: "已连接",
      error: "连接异常",
    },
    stream: {
      stdout: "标准输出",
      stderr: "标准错误",
    },
    decision: {
      allow: "允许",
      deny: "拒绝",
    },
  },
  errors: {
    fetchUnavailable: "当前环境不支持 fetch，请更换运行环境后重试。",
    websocketUnavailable: "当前环境不支持 WebSocket，无法建立实时连接。",
    browserRelayNotConnected: "浏览器尚未连接到 Relay。",
    relayNotReady: "Relay 连接尚未就绪。",
    relayConnectFailed: "连接 Relay 失败，请确认 Relay 服务已经启动。",
    relayCommandFailed: "Relay 命令执行失败。",
    pairingFailed: "配对失败，请检查配对令牌和 Relay 地址。",
    pairingFailedWithStatus: (status: string) => `配对失败，状态码 ${status}。`,
  },
});

const en = defineMessages({
  common: {
    brand: "PocketCoder",
    brandTitle: "Mobile-first coding control",
    languageLabel: "Language",
    localeNames: {
      "zh-CN": "中文",
      en: "English",
    },
    noActivityYet: "No activity received yet",
    waitingPairedDevice: "Waiting for paired device",
  },
  nav: {
    ariaLabel: "Primary navigation",
    pair: "Pair",
    sessions: "Sessions",
    recovery: "Recovery",
  },
  home: {
    eyebrow: "V1 Web Shell",
    title: "Pair fast, read output clearly, release control explicitly.",
    lede:
      "This web shell keeps the browser focused on mobile session UX while deeper transport, protocol, and desktop responsibilities stay outside the page layer.",
    primaryAction: "Start pairing",
    secondaryAction: "View sessions",
    routeMapEyebrow: "Route Map",
    routeMapTitle: "Fixed page set for PocketCoder V1",
    routeMapSubtitle:
      "The root route may guide the user, but the core flow stays anchored to pairing, session browsing, session detail, and recovery.",
    routes: [
      {
        href: "/pair",
        title: "Pair a device",
        description: "Open the pairing surface while keeping key exchange and storage policy out of the route.",
      },
      {
        href: "/sessions",
        title: "Review live sessions",
        description: "Browse active or queued coding sessions with mobile-readable status summaries.",
      },
      {
        href: "/connection-error",
        title: "Plan recovery",
        description: "Keep degraded connection states readable and actionable on a small screen.",
      },
    ],
    architectureEyebrow: "Architecture",
    architectureTitle: "High cohesion, low coupling",
    principles: [
      "Keep App Router pages thin and composition-focused.",
      "Route protocol, realtime, crypto, and storage work through dedicated boundaries.",
      "Leave the shell install-ready from day one instead of bolting PWA support on later.",
    ],
  },
  pairing: {
    heroEyebrow: "Pairing",
    heroTitle: "Bootstrap a trusted mobile endpoint.",
    heroLede:
      "The route stays focused on device linking while relay fetch, browser key scaffolding, and local device persistence remain in the feature and browser-side boundaries.",
    chips: ["HTTP pairing init", "Browser key placeholder", "Local device cache"],
    formEyebrow: "Start Pairing",
    formTitle: "Bind this phone to a desktop relay identity",
    formSubtitle:
      "Provide the relay origin and one-time token from `agentd auth`, then store the paired browser device locally after the relay confirms registration.",
    relayOriginLabel: "Relay origin",
    relayOriginPlaceholder: "https://relay.example.com",
    deviceNameLabel: "Device name",
    deviceNameDefault: "PocketCoder Mobile",
    deviceNamePlaceholder: "PocketCoder Mobile",
    tokenLabel: "Pairing token",
    tokenPlaceholder: "pair.v1.xxxxx",
    submitIdle: "Pair this device",
    submitSubmitting: "Pairing...",
    openSessions: "Open sessions",
    helperText:
      "The paired browser device is stored through `lib/storage` only. Deeper E2EE key lifecycle remains a later hardening step.",
    resultEyebrow: "Pairing Result",
    resultTitle: "Browser device registered",
    browserDeviceLabel: "Browser device",
    desktopDeviceLabel: "Desktop device",
    relayOriginResultLabel: "Relay origin",
    registeredAtLabel: "Registered at",
    continueToSessions: "Continue to sessions",
    flowEyebrow: "Flow",
    flowTitle: "What the pairing feature coordinates",
    steps: [
      {
        title: "Show pairing readiness",
        description: "Confirm the handset is online, authenticated, and ready to bind to a desktop peer.",
      },
      {
        title: "Enter or scan the device token",
        description: "Keep token entry in the feature shell while key handling stays behind browser-side boundaries.",
      },
      {
        title: "Persist the paired identity",
        description: "Store only the browser device record locally after the relay accepts the pairing flow.",
      },
    ],
    guardrailsEyebrow: "Guardrails",
    guardrailsTitle: "Keep the feature boundary honest",
    notes: [
      "Shared protocol schemas still live in `@pocketcoder/protocol` only.",
      "The page shell delegates fetch, key, and storage work to feature or lib boundaries.",
      "Pairing success should leave the sessions route ready to open a live session subscription.",
    ],
  },
  sessions: {
    heroEyebrow: "Sessions",
    heroTitle: "Read the session queue on a phone without losing context.",
    heroLede:
      "This list stays focused on summaries, paired-browser readiness, and navigation. Realtime subscriptions and replay behavior remain in feature or lib boundaries.",
    overviewEyebrow: "Overview",
    overviewTitle: "Current desktop sessions",
    openDetail: "Open detail",
    mockSessions: [
      {
        sessionId: "sess-live-241",
        title: "Refactor desktop pairing handshake",
        status: "Live",
        latency: "42 ms relay hop",
        summary: "Realtime output is flowing and a pending approval may arrive at any time.",
        tone: "live",
      },
      {
        sessionId: "sess-idle-118",
        title: "Tighten relay transport boundaries",
        status: "Idle",
        latency: "Awaiting reconnect",
        summary: "The browser shell should show state clearly without owning reconnection internals.",
        tone: "default",
      },
      {
        sessionId: "sess-review-309",
        title: "Audit workspace bootstrap files",
        status: "Review",
        latency: "Local cache warm",
        summary: "Use feature composition to show recency, health, and approval snapshots.",
        tone: "warn",
      },
    ],
  },
  storedDevice: {
    eyebrow: "Pairing Cache",
    checking: "Checking browser storage for an existing paired device...",
    emptyTitle: "No paired browser device yet",
    emptyDescription:
      "Pair this phone first so the session detail route can open a relay subscription with a registered browser device id.",
    pairPhone: "Pair this phone",
    sectionEyebrow: "Paired Browser Device",
    sectionTitle: "Local relay identity is ready",
    deviceId: "Device id",
    relayOrigin: "Relay origin",
    pairedAt: "Paired at",
    refreshPairing: "Refresh pairing",
    forgetPairing: "Forget local pairing",
  },
  sessionDetail: {
    heroEyebrow: "Session Detail",
    heroLede:
      "The feature shell owns subscription setup, prompt submission, approval responses, and the explicit return-control command while the route stays composition-only.",
    missingPairingLede:
      "This route is ready for realtime subscription, but the browser has no paired device id in local storage yet.",
    missingPairingTitle: "Pair this phone before subscribing",
    missingPairingDescription:
      "The session-detail shell only opens relay WebSocket traffic with a paired browser identity. Start from the pair route, then return here.",
    goToPair: "Go to pair",
    backToSessions: "Back to sessions",
    stateEyebrow: "Session State",
    lastActivityLabel: "Last activity",
    relayOriginLabel: "Relay origin",
    returnControl: "Return control to desktop",
    interruptSession: "Interrupt session",
    interruptReason: "mobile operator interrupt",
    outputEyebrow: "Realtime Output",
    outputTitle: "Stream shell",
    outputNote:
      "Transport ownership stays under `lib/realtime`; the feature renders a mobile-readable feed from the parsed protocol envelopes.",
    outputAriaLabel: "Session output stream",
    approvalsEyebrow: "Approvals",
    noApprovals:
      "No approval request is currently queued for this browser. When the desktop side pauses for approval, the request will surface here.",
    boundariesEyebrow: "Boundaries",
    boundariesTitle: "What stays out of the page layer",
    promptLabel: "Queue the next instruction for the desktop session.",
    promptPlaceholder: "Ask the desktop side to inspect the next file...",
    sendPrompt: "Send prompt",
    currentTaskWaitingSummary: "Awaiting the first session summary from relay.",
    currentTaskConnected: "Desktop session is connected.",
    outputWaiting: "[browser] waiting for relay subscription...",
    outputSubscribed: (sessionId: string) => `[browser] subscribed to ${sessionId}`,
    outputStateReason: (reason: string) => `[state] ${reason}`,
    outputPromptQueued: (prompt: string) => `[browser] prompt queued: ${prompt}`,
    outputApprovalDecision: (approvalId: string, decisionLabel: string) =>
      `[browser] approval ${approvalId} -> ${decisionLabel}`,
    outputResumeControl: "[browser] requested desktop control handoff",
    outputInterrupt: "[browser] interrupt requested for the active session",
    facts: [
      { label: "Ownership", value: "Desktop remains the source of execution" },
      { label: "Realtime", value: "WebSocket stream enters through `lib/realtime`" },
      { label: "Storage", value: "Session hints may persist through `lib/storage` only" },
      { label: "Protocol", value: "Shared contract types come from `@pocketcoder/protocol`" },
    ],
  },
  approval: {
    eyebrow: "Approval",
    approvalId: "Approval id",
    issuedAt: "Issued at",
    allow: "Allow",
    deny: "Deny",
  },
  connectionError: {
    eyebrow: "Connection Error",
    title: "Keep recovery clear when the live link degrades.",
    lede:
      "This screen explains the current failure, offers the next safe action, and avoids hiding transport concerns inside the page component.",
    retry: "Retry connection",
    openPairing: "Open pairing page",
    recoveryEyebrow: "Recovery",
    recoveryTitle: "Suggested next actions",
    steps: [
      "Check whether the desktop relay connection is still active.",
      "Retry the WebSocket subscription through the realtime boundary.",
      "Reconnect with the paired identity instead of re-running the whole pairing flow.",
      "Escalate to desktop recovery only after the mobile shell reports the degraded state clearly.",
    ],
  },
  statuses: {
    session: {
      idle: "Idle",
      running: "Running",
      waiting_input: "Waiting input",
      waiting_approval: "Waiting approval",
      error: "Error",
      disconnected: "Disconnected",
    },
    connection: {
      loading: "Loading",
      missing_pairing: "Not paired",
      connecting: "Connecting",
      connected: "Connected",
      error: "Connection error",
    },
    stream: {
      stdout: "stdout",
      stderr: "stderr",
    },
    decision: {
      allow: "allow",
      deny: "deny",
    },
  },
  errors: {
    fetchUnavailable: "Fetch is not available in this runtime.",
    websocketUnavailable: "WebSocket is not available in this runtime.",
    browserRelayNotConnected: "Browser relay websocket is not connected.",
    relayNotReady: "Relay connection is not ready.",
    relayConnectFailed: "Failed to connect to relay. Confirm that the relay service is running.",
    relayCommandFailed: "Relay command failed.",
    pairingFailed: "Pairing failed. Check the token and relay origin.",
    pairingFailedWithStatus: (status: string) => `Pairing failed with status ${status}.`,
  },
});

export const DEFAULT_LOCALE: Locale = "zh-CN";
export const LOCALE_STORAGE_KEY = "pocketcoder.locale";
export const localeMessages: Record<Locale, Messages> = {
  "zh-CN": zhCN,
  en,
};
