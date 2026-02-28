import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    type StyleProp,
    View,
    type ViewStyle,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import type {
    InboundMessage,
    KalendusCallbacks,
    KalendusProps,
    OutboundMessage,
    ThemeVars,
} from './types';

// ── Props ──────────────────────────────────────────────────────────────

export type KalendusWebViewProps = KalendusProps &
    KalendusCallbacks & {
        /** Inline HTML source string (e.g. from bundling kalendus.html) */
        htmlSource?: string;
        /** Expo asset require() for the HTML file */
        assetSource?: number;
        /** CSS custom property overrides */
        theme?: ThemeVars;
        /** Container style */
        style?: StyleProp<ViewStyle>;
        /** Show a loading spinner until the WebView is ready */
        showLoadingIndicator?: boolean;
    };

// ── Helpers ────────────────────────────────────────────────────────────

const PROP_KEYS: (keyof KalendusProps)[] = [
    'heading',
    'firstDayOfWeek',
    'locale',
    'yearDrillTarget',
    'yearDensityMode',
    'entries',
    'color',
];

function diffProps(
    prev: Partial<KalendusProps>,
    next: Partial<KalendusProps>,
): Partial<KalendusProps> | null {
    const changed: Partial<KalendusProps> = {};
    let hasChanges = false;

    for (const key of PROP_KEYS) {
        const prevVal = prev[key];
        const nextVal = next[key];

        if (nextVal === undefined) continue;

        if (key === 'entries') {
            // Deep compare via JSON for arrays
            if (JSON.stringify(prevVal) !== JSON.stringify(nextVal)) {
                (changed as Record<string, unknown>)[key] = nextVal;
                hasChanges = true;
            }
        } else if (prevVal !== nextVal) {
            (changed as Record<string, unknown>)[key] = nextVal;
            hasChanges = true;
        }
    }

    return hasChanges ? changed : null;
}

function pickProps(allProps: KalendusWebViewProps): Partial<KalendusProps> {
    const result: Partial<KalendusProps> = {};
    for (const key of PROP_KEYS) {
        if (allProps[key] !== undefined) {
            (result as Record<string, unknown>)[key] = allProps[key];
        }
    }
    return result;
}

// ── Component ──────────────────────────────────────────────────────────

export function KalendusWebView(props: KalendusWebViewProps) {
    const {
        htmlSource,
        assetSource,
        theme,
        style,
        showLoadingIndicator = true,
        onEntryPress,
        onDateExpand,
        onViewChange,
        onDateChange,
        onJumpToday,
        onMenuClose,
        onExportICS,
        onReady,
        onError,
        ...rest
    } = props;

    const webViewRef = useRef<WebView>(null);
    const [ready, setReady] = useState(false);
    const prevPropsRef = useRef<Partial<KalendusProps>>({});
    const pendingPropsRef = useRef<Partial<KalendusProps> | null>(null);
    const prevThemeRef = useRef<ThemeVars | undefined>(undefined);

    // Stable ref for callbacks so onMessage doesn't cause remounts
    const callbacksRef = useRef<KalendusCallbacks>({});
    callbacksRef.current = {
        onEntryPress,
        onDateExpand,
        onViewChange,
        onDateChange,
        onJumpToday,
        onMenuClose,
        onExportICS,
        onReady,
        onError,
    };

    // ── Send message to WebView ────────────────────────────────────────

    const postMessage = useCallback((msg: InboundMessage) => {
        webViewRef.current?.postMessage(JSON.stringify(msg));
    }, []);

    // ── Handle messages from WebView ───────────────────────────────────

    const handleMessage = useCallback((event: WebViewMessageEvent) => {
        let msg: OutboundMessage;
        try {
            msg = JSON.parse(event.nativeEvent.data) as OutboundMessage;
        } catch {
            return;
        }

        const cb = callbacksRef.current;

        switch (msg.type) {
            case 'ready':
                setReady(true);
                cb.onReady?.();
                break;
            case 'error':
                cb.onError?.(msg.message);
                break;
            case 'event':
                switch (msg.name) {
                    case 'open-menu':
                        cb.onEntryPress?.(msg.detail);
                        break;
                    case 'expand':
                        cb.onDateExpand?.(msg.detail);
                        break;
                    case 'switchview':
                        cb.onViewChange?.(msg.detail);
                        break;
                    case 'switchdate':
                        cb.onDateChange?.(msg.detail);
                        break;
                    case 'jumptoday':
                        cb.onJumpToday?.(msg.detail);
                        break;
                    case 'menu-close':
                        cb.onMenuClose?.();
                        break;
                    case 'export-ics':
                        cb.onExportICS?.(msg.detail);
                        break;
                }
                break;
        }
    }, []);

    // ── Sync props to WebView ──────────────────────────────────────────

    useEffect(() => {
        const currentProps = pickProps(props);

        if (!ready) {
            // Queue props until ready
            pendingPropsRef.current = currentProps;
            return;
        }

        // Flush pending props on first ready
        if (pendingPropsRef.current) {
            postMessage({ type: 'setProps', props: pendingPropsRef.current });
            prevPropsRef.current = pendingPropsRef.current;
            pendingPropsRef.current = null;
            return;
        }

        // Diff and send only changes
        const diff = diffProps(prevPropsRef.current, currentProps);
        if (diff) {
            postMessage({ type: 'setProps', props: diff });
            prevPropsRef.current = currentProps;
        }
    }, [
        ready,
        props.heading,
        props.firstDayOfWeek,
        props.locale,
        props.yearDrillTarget,
        props.yearDensityMode,
        props.entries,
        props.color,
        postMessage,
    ]);

    // ── Sync theme to WebView ──────────────────────────────────────────

    useEffect(() => {
        if (!ready || !theme) return;
        if (JSON.stringify(prevThemeRef.current) === JSON.stringify(theme)) return;

        postMessage({ type: 'setTheme', vars: theme });
        prevThemeRef.current = theme;
    }, [ready, theme, postMessage]);

    // ── WebView source ─────────────────────────────────────────────────

    const source = htmlSource
        ? { html: htmlSource }
        : assetSource
          ? { uri: assetSource as unknown as string }
          : undefined;

    if (!source) {
        if (__DEV__) {
            console.warn(
                'KalendusWebView: Provide either htmlSource (string) or assetSource (require).',
            );
        }
        return null;
    }

    // ── Render ─────────────────────────────────────────────────────────

    return (
        <View style={[{ flex: 1 }, style]}>
            <WebView
                ref={webViewRef}
                source={source}
                onMessage={handleMessage}
                originWhitelist={['*']}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
                bounces={false}
                overScrollMode="never"
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1, backgroundColor: 'transparent' }}
                containerStyle={{ flex: 1 }}
            />
            {showLoadingIndicator && !ready && (
                <View
                    style={{
                        ...StyleSheet.absoluteFillObject,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    }}
                >
                    <ActivityIndicator size="large" />
                </View>
            )}
        </View>
    );
}

// Inline minimal StyleSheet reference to avoid extra import
const StyleSheet = {
    absoluteFillObject: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
};

export default KalendusWebView;
