/* eslint-disable no-console,@typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

'use client';

import {
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Gauge,
  Globe,
  Home,
  LogOut,
  MessageSquare,
  Monitor,
  MoveDown,
  MoveUp,
  Package,
  Puzzle,
  Router as RouterIcon,
  Rss,
  Settings,
  Shield,
  Sliders,
  Smartphone,
  Star,
  Tablet,
  User,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { getAuthInfoFromBrowserCookie } from '@/lib/auth';
import { clearAllDanmakuCache, getDanmakuCacheStats } from '@/lib/danmaku/api';
import { SAVE_LIVE_PLAY_RECORDS_KEY } from '@/lib/db.client';
import {
  LOCAL_SETTINGS_KEYS,
  LOCAL_SETTINGS_SYNC_LAST_PULL_KEY,
  type LocalSettingsPayload,
} from '@/lib/local-settings-sync';
import { clearBangumiImageFallbackCache } from '@/lib/utils';
import { CURRENT_VERSION } from '@/lib/version';
import { UpdateStatus } from '@/lib/version_check';

import { DeviceManagementPanel } from './DeviceManagementPanel';
import { DownloadManagementPanel } from './DownloadManagementPanel';
import { EmailSettingsPanel } from './EmailSettingsPanel';
import { FavoritesPanel } from './FavoritesPanel';
import { NotificationPanel } from './NotificationPanel';
import { OfflineDownloadPanel } from './OfflineDownloadPanel';
import { PersonalCenterPanel } from './PersonalCenterPanel';
import Toast, { ToastProps } from './Toast';
import TVRemotePanel from './tv/TVRemotePanel';
import { useVersionCheck } from './VersionCheckProvider';
import { VersionPanel } from './VersionPanel';

interface AuthInfo {
  username?: string;
  role?: 'owner' | 'admin' | 'user';
}

export const UserMenu: React.FC = () => {
  const router = useRouter();
  const { updateStatus, isChecking } = useVersionCheck();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileCenterOpen, setIsProfileCenterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [isVersionPanelOpen, setIsVersionPanelOpen] = useState(false);
  const [isOfflineDownloadPanelOpen, setIsOfflineDownloadPanelOpen] =
    useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isFavoritesPanelOpen, setIsFavoritesPanelOpen] = useState(false);
  const [isEmailSettingsOpen, setIsEmailSettingsOpen] = useState(false);
  const [isDeviceManagementOpen, setIsDeviceManagementOpen] = useState(false);
  const [isEcoAppsOpen, setIsEcoAppsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDownloadManagementOpen, setIsDownloadManagementOpen] =
    useState(false);
  const [isTVRemoteOpen, setIsTVRemoteOpen] = useState(false);
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [storageType, setStorageType] = useState<string>('localstorage');
  const [displayStorageType, setDisplayStorageType] =
    useState<string>('localstorage');
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 订阅相关状态
  const [subscribeEnabled, setSubscribeEnabled] = useState(false);
  const [tvModeEnabled, setTvModeEnabled] = useState(true);
  const [subscribeUrl, setSubscribeUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [orionBaseUrlCopySuccess, setOrionBaseUrlCopySuccess] = useState(false);
  const [tvboxToken, setTvboxToken] = useState('');
  const [isResettingToken, setIsResettingToken] = useState(false);
  const [isLoadingSubscribeUrl, setIsLoadingSubscribeUrl] = useState(false);
  const [subscribeAdFilterEnabled, setSubscribeAdFilterEnabled] =
    useState(false);
  const [subscribeYellowFilterEnabled, setSubscribeYellowFilterEnabled] =
    useState(false);

  // Web 电视扫码登录入口（手机摄像头扫描电视端二维码）
  const [isTvQrScannerOpen, setIsTvQrScannerOpen] = useState(false);
  const [tvQrScannerStatus, setTvQrScannerStatus] = useState('');
  const [tvQrScannerError, setTvQrScannerError] = useState('');
  const tvQrVideoRef = useRef<HTMLVideoElement | null>(null);
  const tvQrStreamRef = useRef<MediaStream | null>(null);
  const tvQrScanStopRef = useRef(false);
  const [tvAccessTab, setTvAccessTab] = useState<'tvbox' | 'orion' | 'web'>('tvbox');

  // Body 滚动锁定 - 使用 overflow 方式避免布局问题
  useEffect(() => {
    if (
      isProfileCenterOpen ||
      isSettingsOpen ||
      isChangePasswordOpen ||
      isSubscribeOpen ||
      isOfflineDownloadPanelOpen ||
      isEmailSettingsOpen ||
      isDeviceManagementOpen ||
      isEcoAppsOpen ||
      isReportOpen ||
      isDownloadManagementOpen ||
      isTvQrScannerOpen ||
      isTVRemoteOpen
    ) {
      const body = document.body;
      const html = document.documentElement;

      // 保存原始样式
      const originalBodyOverflow = body.style.overflow;
      const originalHtmlOverflow = html.style.overflow;

      // 只设置 overflow 来阻止滚动
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';

      return () => {
        // 恢复所有原始样式
        body.style.overflow = originalBodyOverflow;
        html.style.overflow = originalHtmlOverflow;
      };
    }
  }, [
    isProfileCenterOpen,
    isSettingsOpen,
    isChangePasswordOpen,
    isSubscribeOpen,
    isOfflineDownloadPanelOpen,
    isEmailSettingsOpen,
    isDeviceManagementOpen,
    isEcoAppsOpen,
    isReportOpen,
    isDownloadManagementOpen,
    isTvQrScannerOpen,
    isTVRemoteOpen,
  ]);

  // 设置相关状态
  const [defaultAggregateSearch, setDefaultAggregateSearch] = useState(true);
  const [saveLivePlayRecords, setSaveLivePlayRecords] = useState(false);
  const [doubanProxyUrl, setDoubanProxyUrl] = useState('');
  const [enableOptimization, setEnableOptimization] = useState(true);
  const [preferStrategy, setPreferStrategy] = useState<'fast' | 'full'>('fast');
  const [speedTestTimeout, setSpeedTestTimeout] = useState(4000); // 测速超时时间（毫秒）
  const [fluidSearch, setFluidSearch] = useState(true);
  const [tmdbBackdropDisabled, setTmdbBackdropDisabled] = useState(false);
  const [enableTrailers, setEnableTrailers] = useState(false);
  const [doubanDataSource, setDoubanDataSource] = useState(
    'cmliussss-cdn-tencent'
  );
  const [doubanDataSourceBackup, setDoubanDataSourceBackup] =
    useState('direct');
  const [animeDataSource, setAnimeDataSource] = useState('direct');
  const [animeDataSourceBackup, setAnimeDataSourceBackup] =
    useState('server-proxy');
  const [animeCustomBaseUrl, setAnimeCustomBaseUrl] = useState('');
  const [animeImageBaseUrl, setAnimeImageBaseUrl] = useState('');
  const [bangumiProxyScript, setBangumiProxyScript] = useState('');
  const [bangumiProxyScriptCopied, setBangumiProxyScriptCopied] =
    useState(false);
  const [doubanImageProxyType, setDoubanImageProxyType] = useState(
    'cmliussss-cdn-tencent'
  );
  const [doubanImageProxyTypeBackup, setDoubanImageProxyTypeBackup] =
    useState('server');
  const [doubanImageProxyUrl, setDoubanImageProxyUrl] = useState('');
  const [doubanProxyUrlBackup, setDoubanProxyUrlBackup] = useState('');
  const [doubanImageProxyUrlBackup, setDoubanImageProxyUrlBackup] =
    useState('');
  const [isDoubanDropdownOpen, setIsDoubanDropdownOpen] = useState(false);
  const [isDoubanBackupDropdownOpen, setIsDoubanBackupDropdownOpen] =
    useState(false);
  const [isAnimeDropdownOpen, setIsAnimeDropdownOpen] = useState(false);
  const [isAnimeBackupDropdownOpen, setIsAnimeBackupDropdownOpen] =
    useState(false);
  const [isDoubanImageProxyDropdownOpen, setIsDoubanImageProxyDropdownOpen] =
    useState(false);
  const [
    isDoubanImageProxyBackupDropdownOpen,
    setIsDoubanImageProxyBackupDropdownOpen,
  ] = useState(false);
  const [bufferStrategy, setBufferStrategy] = useState('medium');
  const [nextEpisodePreCache, setNextEpisodePreCache] = useState(true);
  const [nextEpisodeDanmakuPreload, setNextEpisodeDanmakuPreload] =
    useState(true);
  const [disablePlaybackThumbnail, setDisablePlaybackThumbnail] =
    useState(true);
  const [disableAutoLoadDanmaku, setDisableAutoLoadDanmaku] = useState(false);
  const [danmakuMaxCount, setDanmakuMaxCount] = useState(5000);
  const [danmakuHeatmapDisabled, setDanmakuHeatmapDisabled] = useState(false);
  const [danmakuTraditionalToSimplified, setDanmakuTraditionalToSimplified] =
    useState(false);
  const [searchTraditionalToSimplified, setSearchTraditionalToSimplified] =
    useState(false);
  const [exactSearch, setExactSearch] = useState(true);
  const [maxConcurrentDownloads, setMaxConcurrentDownloads] = useState(6);
  const [downloadThreadsPerTask, setDownloadThreadsPerTask] = useState(6);
  const [downloadSegmentTimeout, setDownloadSegmentTimeout] = useState(30000);
  const [downloadMode, setDownloadMode] = useState<'browser' | 'filesystem' | 'indexeddb'>(
    'browser'
  );
  const [filesystemSavePath, setFilesystemSavePath] = useState<string>('');

  // 通知设置
  const [userEmail, setUserEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [pushNotificationsConfigured, setPushNotificationsConfigured] = useState(false);
  const [pushNotificationsSupported, setPushNotificationsSupported] = useState(false);
  const [pushNotificationsBusy, setPushNotificationsBusy] = useState(false);
  const [emailSettingsLoading, setEmailSettingsLoading] = useState(false);
  const [emailSettingsSaving, setEmailSettingsSaving] = useState(false);
  const [emailSettingsMessage, setEmailSettingsMessage] = useState('');
  const [emailSettingsMessageType, setEmailSettingsMessageType] = useState<
    'success' | 'error' | null
  >(null);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramBound, setTelegramBound] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [telegramBindCode, setTelegramBindCode] = useState('');
  const [telegramDeepLink, setTelegramDeepLink] = useState('');
  const [telegramBindingBusy, setTelegramBindingBusy] = useState(false);

  // 设备管理状态
  const [devices, setDevices] = useState<any[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => undefined,
  });

  // 折叠面板状态
  const [isDoubanSectionOpen, setIsDoubanSectionOpen] = useState(false);

  // TMDB 图片设置（默认取站点配置的 TMDB 图片默认地址，用户可本地覆盖）
  const [tmdbImageBaseUrl, setTmdbImageBaseUrl] = useState(
    typeof window !== 'undefined'
      ? ((window as any).RUNTIME_CONFIG?.TMDB_IMAGE_BASE_URL as string) ||
        'https://image.tmdb.org'
      : 'https://image.tmdb.org'
  );
  const [isUsageSectionOpen, setIsUsageSectionOpen] = useState(false);
  const [isDownloadSectionOpen, setIsDownloadSectionOpen] = useState(false);
  const [isBufferSectionOpen, setIsBufferSectionOpen] = useState(false);
  const [isDanmakuSectionOpen, setIsDanmakuSectionOpen] = useState(false);
  const [isHomepageSectionOpen, setIsHomepageSectionOpen] = useState(false);

  // 本地设置云同步状态
  const [syncMode, setSyncMode] = useState<'off' | 'manual' | 'auto'>('off');
  const [syncAvailable, setSyncAvailable] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncToast, setSyncToast] = useState<ToastProps | null>(null);
  const [isCloudBackupDropdownOpen, setIsCloudBackupDropdownOpen] =
    useState(false);

  // 首页模块配置
  interface HomeModule {
    id: string;
    name: string;
    enabled: boolean;
    order: number;
  }

  type HomeBannerHeightScale = '1' | '1.5' | '2';

  const defaultHomeModules: HomeModule[] = [
    { id: 'hotMovies', name: '热门电影', enabled: true, order: 0 },
    { id: 'hotDuanju', name: '热播短剧', enabled: true, order: 1 },
    { id: 'bangumiCalendar', name: '新番放送', enabled: true, order: 2 },
    { id: 'hotTvShows', name: '热门剧集', enabled: true, order: 3 },
    { id: 'hotVarietyShows', name: '热门综艺', enabled: true, order: 4 },
    { id: 'upcomingContent', name: '即将上映', enabled: true, order: 5 },
  ];

  const [homeModules, setHomeModules] =
    useState<HomeModule[]>(defaultHomeModules);
  const [homeBannerEnabled, setHomeBannerEnabled] = useState(true);
  const [homeBannerHeightScale, setHomeBannerHeightScale] =
    useState<HomeBannerHeightScale>('1');
  const [homeContinueWatchingEnabled, setHomeContinueWatchingEnabled] =
    useState(true);

  const homeBannerHeightOptions: {
    value: HomeBannerHeightScale;
    label: string;
    description: string;
  }[] = [
    { value: '1', label: '标准', description: '1x' },
    { value: '1.5', label: '增高', description: '1.5x' },
    { value: '2', label: '特高', description: '2x' },
  ];

  // 豆瓣数据源选项
  const doubanDataSourceOptions = [
    { value: 'direct', label: '直连（服务器直接请求豆瓣）' },
    { value: 'cors-proxy-zwei', label: 'Cors Proxy By Zwei' },
    {
      value: 'cmliussss-cdn-tencent',
      label: '豆瓣 CDN By CMLiussss（腾讯云）',
    },
    { value: 'cmliussss-cdn-ali', label: '豆瓣 CDN By CMLiussss（阿里云）' },
    { value: 'custom', label: '自定义代理' },
  ];

  const animeDataSourceOptions = [
    { value: 'direct', label: '直连（浏览器直连 Bangumi）' },
    { value: 'server-proxy', label: '服务器代理（由服务器访问 Bangumi）' },
    { value: 'sakura', label: '桜色镜像站（bangumi.lol）' },
    { value: 'custom-baseurl', label: '自定义 Base URL' },
  ];

  // 豆瓣图片代理选项
  const doubanImageProxyTypeOptions = [
    { value: 'server', label: '服务器代理（由服务器代理请求豆瓣）' },
    {
      value: 'cmliussss-cdn-tencent',
      label: '豆瓣 CDN By CMLiussss（腾讯云）',
    },
    { value: 'cmliussss-cdn-ali', label: '豆瓣 CDN By CMLiussss（阿里云）' },
    { value: 'custom', label: '自定义代理' },
    {
      value: 'direct',
      label: '直连（浏览器直接请求豆瓣，可能需要浏览器插件才能正常显示）',
    },
    {
      value: 'img3',
      label: '豆瓣官方精品 CDN（阿里云，可能需要浏览器插件才能正常显示）',
    },
  ];

  // 缓冲策略选项
  const bufferStrategyOptions = [
    { value: 'low', label: '低缓冲（省流量）' },
    { value: 'medium', label: '中缓冲（推荐）' },
    { value: 'high', label: '高缓冲（流畅播放）' },
    { value: 'ultra', label: '超高缓冲（极速体验）' },
  ];

  // 修改密码相关状态
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // 清除弹幕缓存相关状态
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [clearCacheMessage, setClearCacheMessage] = useState<string | null>(
    null
  );
  const [danmakuCacheUsage, setDanmakuCacheUsage] = useState('计算中...');

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true);
  }, []);

  // 加载未读通知数量
  const loadUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        const count = data.unreadCount || 0;
        setUnreadCount(count);
        // 同步到全局，让其他 UserMenu 实例也能获取
        if (typeof window !== 'undefined') {
          (window as any).__unreadNotificationCount = count;
        }
      }
    } catch (error) {
      console.error('加载未读通知数量失败:', error);
    }
  };

  const formatCacheSize = useCallback((size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }, []);

  const loadDanmakuCacheUsage = useCallback(async () => {
    try {
      const stats = await getDanmakuCacheStats();
      setDanmakuCacheUsage(formatCacheSize(stats.totalSize));
    } catch (error) {
      console.error('获取弹幕缓存占用失败:', error);
      setDanmakuCacheUsage('获取失败');
    }
  }, [formatCacheSize]);

  // 首次加载时检查未读通知数量（使用全局标记避免多个实例重复请求）
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 检查是否已经有其他实例在加载
    const globalWindow = window as any;
    if (globalWindow.__loadingNotifications) {
      // 如果正在加载，等待加载完成后获取结果
      const checkInterval = setInterval(() => {
        if (
          !globalWindow.__loadingNotifications &&
          globalWindow.__unreadNotificationCount !== undefined
        ) {
          setUnreadCount(globalWindow.__unreadNotificationCount);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // 检查是否已经加载过
    if (globalWindow.__unreadNotificationCount !== undefined) {
      setUnreadCount(globalWindow.__unreadNotificationCount);
      return;
    }

    // 标记正在加载
    globalWindow.__loadingNotifications = true;
    loadUnreadCount().finally(() => {
      globalWindow.__loadingNotifications = false;
    });
  }, []);

  useEffect(() => {
    if (!mounted || !isSettingsOpen || !isDanmakuSectionOpen) return;
    void (async () => {
      await loadDanmakuCacheUsage();
    })();
  }, [loadDanmakuCacheUsage, mounted, isSettingsOpen, isDanmakuSectionOpen]);

  // 监听通知更新事件
  useEffect(() => {
    const handleNotificationsUpdated = () => {
      // 清除缓存，强制重新加载
      if (typeof window !== 'undefined') {
        delete (window as any).__unreadNotificationCount;
      }
      loadUnreadCount();
    };

    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    return () => {
      window.removeEventListener(
        'notificationsUpdated',
        handleNotificationsUpdated
      );
    };
  }, []);

  // 从运行时配置读取订阅是否启用
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const enabled =
        (window as any).RUNTIME_CONFIG?.ENABLE_TVBOX_SUBSCRIBE || false;
      setSubscribeEnabled(enabled);
      setTvModeEnabled((window as any).RUNTIME_CONFIG?.ENABLE_TV_MODE !== false);
    }
  }, []);

  // 懒加载订阅 URL - 只在打开订阅面板时请求
  const fetchSubscribeUrl = async () => {
    setIsLoadingSubscribeUrl(true);
    try {
      // 获取用户的 TVBox token
      const response = await fetch('/api/user/tvbox-token');
      if (response.ok) {
        const data = await response.json();
        const token = data.token;
        setTvboxToken(token);

        setSubscribeUrl(
          buildSubscribeUrl(
            token,
            subscribeAdFilterEnabled,
            subscribeYellowFilterEnabled
          )
        );
      }
    } catch (error) {
      console.error('获取订阅URL失败:', error);
    } finally {
      setIsLoadingSubscribeUrl(false);
    }
  };

  // 重置 TVBox token
  const handleResetToken = async () => {
    setConfirmDialog({
      isOpen: true,
      title: '重置订阅Token',
      message: '确定要重置订阅token吗？重置后旧的订阅链接将失效。',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setIsResettingToken(true);

        try {
          const response = await fetch('/api/user/tvbox-token/reset', {
            method: 'POST',
          });

          const messageEl = document.getElementById('tvbox-token-message');
          if (response.ok) {
            const data = await response.json();
            const token = data.token;
            setTvboxToken(token);

            setSubscribeUrl(
              buildSubscribeUrl(
                token,
                subscribeAdFilterEnabled,
                subscribeYellowFilterEnabled
              )
            );

            if (messageEl) {
              messageEl.textContent = '订阅token已重置！';
              messageEl.className =
                'text-xs text-center text-green-600 dark:text-green-400 mt-2';
              messageEl.classList.remove('hidden');
              setTimeout(() => {
                messageEl.classList.add('hidden');
              }, 3000);
            }
          } else {
            const data = await response.json();
            if (messageEl) {
              messageEl.textContent = data.error || '重置失败，请重试';
              messageEl.className =
                'text-xs text-center text-red-600 dark:text-red-400 mt-2';
              messageEl.classList.remove('hidden');
            }
          }
        } catch (error) {
          console.error('重置token失败:', error);
          const messageEl = document.getElementById('tvbox-token-message');
          if (messageEl) {
            messageEl.textContent = '重置失败，请重试';
            messageEl.className =
              'text-xs text-center text-red-600 dark:text-red-400 mt-2';
            messageEl.classList.remove('hidden');
          }
        } finally {
          setIsResettingToken(false);
        }
      },
    });
  };

  const buildSubscribeUrl = (
    token: string,
    adFilter: boolean,
    yellowFilter: boolean
  ) => {
    const currentOrigin = window.location.origin;
    const url = new URL('/api/tvbox/subscribe', currentOrigin);
    url.searchParams.set('token', token);
    if (adFilter) {
      url.searchParams.set('adFilter', 'true');
    }
    if (yellowFilter) {
      url.searchParams.set('yellowFilter', 'true');
    }
    return url.toString();
  };

  // 获取认证信息和存储类型
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = getAuthInfoFromBrowserCookie();
      setAuthInfo(auth);

      const runtimeConfig = (window as any).RUNTIME_CONFIG || {};
      const type = runtimeConfig.STORAGE_TYPE || 'localstorage';
      const displayType = runtimeConfig.DISPLAY_STORAGE_TYPE || type;
      setStorageType(type);
      setDisplayStorageType(displayType);
    }
  }, []);

  // 从 localStorage 读取设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAggregateSearch = localStorage.getItem(
        'defaultAggregateSearch'
      );
      if (savedAggregateSearch !== null) {
        setDefaultAggregateSearch(JSON.parse(savedAggregateSearch));
      }

      const savedSaveLivePlayRecords = localStorage.getItem(
        SAVE_LIVE_PLAY_RECORDS_KEY
      );
      if (savedSaveLivePlayRecords !== null) {
        setSaveLivePlayRecords(savedSaveLivePlayRecords === 'true');
      }

      const savedDoubanDataSource = localStorage.getItem('doubanDataSource');
      const defaultDoubanProxyType =
        (window as any).RUNTIME_CONFIG?.DOUBAN_PROXY_TYPE ||
        'cmliussss-cdn-tencent';
      if (savedDoubanDataSource !== null) {
        setDoubanDataSource(savedDoubanDataSource);
      } else if (defaultDoubanProxyType) {
        setDoubanDataSource(defaultDoubanProxyType);
      }

      const savedDoubanProxyUrl = localStorage.getItem('doubanProxyUrl');
      const defaultDoubanProxy =
        (window as any).RUNTIME_CONFIG?.DOUBAN_PROXY || '';
      if (savedDoubanProxyUrl !== null) {
        setDoubanProxyUrl(savedDoubanProxyUrl);
      } else if (defaultDoubanProxy) {
        setDoubanProxyUrl(defaultDoubanProxy);
      }

      const savedDoubanDataSourceBackup = localStorage.getItem(
        'doubanDataSourceBackup'
      );
      setDoubanDataSourceBackup(savedDoubanDataSourceBackup || 'direct');

      const savedDoubanProxyUrlBackup = localStorage.getItem(
        'doubanProxyUrlBackup'
      );
      setDoubanProxyUrlBackup(savedDoubanProxyUrlBackup || '');

      const savedAnimeDataSource = localStorage.getItem('animeDataSource');
      const defaultAnimeDataSource =
        (window as any).RUNTIME_CONFIG?.BANGUMI_DATA_SOURCE || 'direct';
      setAnimeDataSource(savedAnimeDataSource || defaultAnimeDataSource);

      const savedAnimeDataSourceBackup = localStorage.getItem(
        'animeDataSourceBackup'
      );
      setAnimeDataSourceBackup(savedAnimeDataSourceBackup || 'server-proxy');

      const savedAnimeCustomBaseUrl =
        localStorage.getItem('animeCustomBaseUrl');
      setAnimeCustomBaseUrl(savedAnimeCustomBaseUrl || '');

      const savedAnimeImageBaseUrl = localStorage.getItem('animeImageBaseUrl');
      setAnimeImageBaseUrl(savedAnimeImageBaseUrl || '');

      fetch('/scripts/bangumi-proxy.worker.js')
        .then((response) => (response.ok ? response.text() : ''))
        .then(setBangumiProxyScript)
        .catch((error) => {
          console.error('加载 Bangumi Workers 脚本失败:', error);
        });

      const savedDoubanImageProxyType = localStorage.getItem(
        'doubanImageProxyType'
      );
      const defaultDoubanImageProxyType =
        (window as any).RUNTIME_CONFIG?.DOUBAN_IMAGE_PROXY_TYPE ||
        'cmliussss-cdn-tencent';
      if (savedDoubanImageProxyType !== null) {
        setDoubanImageProxyType(savedDoubanImageProxyType);
      } else if (defaultDoubanImageProxyType) {
        setDoubanImageProxyType(defaultDoubanImageProxyType);
      }

      const savedDoubanImageProxyUrl = localStorage.getItem(
        'doubanImageProxyUrl'
      );
      const defaultDoubanImageProxyUrl =
        (window as any).RUNTIME_CONFIG?.DOUBAN_IMAGE_PROXY || '';
      if (savedDoubanImageProxyUrl !== null) {
        setDoubanImageProxyUrl(savedDoubanImageProxyUrl);
      } else if (defaultDoubanImageProxyUrl) {
        setDoubanImageProxyUrl(defaultDoubanImageProxyUrl);
      }

      const savedDoubanImageProxyTypeBackup = localStorage.getItem(
        'doubanImageProxyTypeBackup'
      );
      setDoubanImageProxyTypeBackup(
        savedDoubanImageProxyTypeBackup || 'server'
      );

      const savedDoubanImageProxyUrlBackup = localStorage.getItem(
        'doubanImageProxyUrlBackup'
      );
      setDoubanImageProxyUrlBackup(savedDoubanImageProxyUrlBackup || '');

      const savedTmdbImageBaseUrl = localStorage.getItem('tmdbImageBaseUrl');
      if (savedTmdbImageBaseUrl !== null) {
        setTmdbImageBaseUrl(savedTmdbImageBaseUrl);
      }

      const savedEnableOptimization =
        localStorage.getItem('enableOptimization');
      if (savedEnableOptimization !== null) {
        setEnableOptimization(JSON.parse(savedEnableOptimization));
      }

      const savedPreferStrategy = localStorage.getItem('preferStrategy');
      if (savedPreferStrategy === 'fast' || savedPreferStrategy === 'full') {
        setPreferStrategy(savedPreferStrategy);
      }

      const savedSpeedTestTimeout = localStorage.getItem('speedTestTimeout');
      if (savedSpeedTestTimeout !== null) {
        setSpeedTestTimeout(Number(savedSpeedTestTimeout));
      }

      const savedFluidSearch = localStorage.getItem('fluidSearch');
      const defaultFluidSearch =
        (window as any).RUNTIME_CONFIG?.FLUID_SEARCH !== false;
      if (savedFluidSearch !== null) {
        setFluidSearch(JSON.parse(savedFluidSearch));
      } else if (defaultFluidSearch !== undefined) {
        setFluidSearch(defaultFluidSearch);
      }

      const savedTmdbBackdropDisabled = localStorage.getItem(
        'tmdb_backdrop_disabled'
      );
      if (savedTmdbBackdropDisabled !== null) {
        setTmdbBackdropDisabled(savedTmdbBackdropDisabled === 'true');
      }

      const savedEnableTrailers = localStorage.getItem('enableTrailers');
      if (savedEnableTrailers !== null) {
        setEnableTrailers(savedEnableTrailers === 'true');
      }

      const savedBufferStrategy = localStorage.getItem('bufferStrategy');
      if (savedBufferStrategy !== null) {
        setBufferStrategy(savedBufferStrategy);
      }

      const savedNextEpisodePreCache = localStorage.getItem(
        'nextEpisodePreCache'
      );
      if (savedNextEpisodePreCache !== null) {
        setNextEpisodePreCache(savedNextEpisodePreCache === 'true');
      }

      const savedNextEpisodeDanmakuPreload = localStorage.getItem(
        'nextEpisodeDanmakuPreload'
      );
      if (savedNextEpisodeDanmakuPreload !== null) {
        setNextEpisodeDanmakuPreload(savedNextEpisodeDanmakuPreload === 'true');
      }

      const savedDisablePlaybackThumbnail = localStorage.getItem(
        'disablePlaybackThumbnail'
      );
      if (savedDisablePlaybackThumbnail !== null) {
        setDisablePlaybackThumbnail(savedDisablePlaybackThumbnail === 'true');
      }

      const savedDisableAutoLoadDanmaku = localStorage.getItem(
        'disableAutoLoadDanmaku'
      );
      if (savedDisableAutoLoadDanmaku !== null) {
        setDisableAutoLoadDanmaku(savedDisableAutoLoadDanmaku === 'true');
      } else {
        const runtimeDefault =
          (window as any).RUNTIME_CONFIG?.DANMAKU_AUTO_LOAD_DEFAULT !== false;
        setDisableAutoLoadDanmaku(!runtimeDefault);
      }

      const savedDanmakuMaxCount = localStorage.getItem('danmakuMaxCount');
      if (savedDanmakuMaxCount !== null) {
        setDanmakuMaxCount(parseInt(savedDanmakuMaxCount, 10));
      }

      const savedDanmakuHeatmapDisabled = localStorage.getItem(
        'danmaku_heatmap_disabled'
      );
      if (savedDanmakuHeatmapDisabled !== null) {
        setDanmakuHeatmapDisabled(savedDanmakuHeatmapDisabled === 'true');
      }

      const savedHomeBannerEnabled = localStorage.getItem('homeBannerEnabled');
      if (savedHomeBannerEnabled !== null) {
        setHomeBannerEnabled(savedHomeBannerEnabled === 'true');
      }

      const savedHomeBannerHeightScale = localStorage.getItem(
        'homeBannerHeightScale'
      );
      if (
        savedHomeBannerHeightScale === '1' ||
        savedHomeBannerHeightScale === '1.5' ||
        savedHomeBannerHeightScale === '2'
      ) {
        setHomeBannerHeightScale(savedHomeBannerHeightScale);
      }

      const savedHomeContinueWatchingEnabled = localStorage.getItem(
        'homeContinueWatchingEnabled'
      );
      if (savedHomeContinueWatchingEnabled !== null) {
        setHomeContinueWatchingEnabled(
          savedHomeContinueWatchingEnabled === 'true'
        );
      }

      // 加载首页模块配置
      const savedHomeModules = localStorage.getItem('homeModules');
      if (savedHomeModules !== null) {
        try {
          setHomeModules(JSON.parse(savedHomeModules));
        } catch (error) {
          console.error('解析首页模块配置失败:', error);
        }
      }

      // 加载弹幕繁简转换设置
      const savedDanmakuTraditionalToSimplified = localStorage.getItem(
        'danmakuTraditionalToSimplified'
      );
      if (savedDanmakuTraditionalToSimplified !== null) {
        setDanmakuTraditionalToSimplified(
          savedDanmakuTraditionalToSimplified === 'true'
        );
      }

      // 加载搜索繁体转简体设置
      const savedSearchTraditionalToSimplified = localStorage.getItem(
        'searchTraditionalToSimplified'
      );
      if (savedSearchTraditionalToSimplified !== null) {
        setSearchTraditionalToSimplified(
          savedSearchTraditionalToSimplified === 'true'
        );
      }

      // 加载精确搜索设置
      const savedExactSearch = localStorage.getItem('exactSearch');
      if (savedExactSearch !== null) {
        setExactSearch(savedExactSearch === 'true');
      }

      // 加载最大同时下载限制设置
      const savedMaxConcurrentDownloads = localStorage.getItem(
        'maxConcurrentDownloads'
      );
      if (savedMaxConcurrentDownloads !== null) {
        setMaxConcurrentDownloads(Number(savedMaxConcurrentDownloads));
      }
