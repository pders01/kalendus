import { Asset } from 'expo-asset';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { injection, NativeSession, PROP_KEYS } from './protocol';
import type { KalendusCallbacks, KalendusProps, Snapshot, ThemeVars } from './types';

export type KalendusWebViewProps = KalendusProps &
    KalendusCallbacks & {
        /** Trusted, self-contained HTML (use build-shell.mjs --inline). */
        htmlSource?: string;
        /** Static HTML require() module, downloaded/resolved with Expo Asset (never cast to a URI). */
        assetSource?: number;
        theme?: ThemeVars;
        /** With this non-negative safe integer set, change it to apply/reassert the supplied date and view. */
        navigationRevision?: number;
        style?: StyleProp<ViewStyle>;
        showLoadingIndicator?: boolean;
    };

export function KalendusWebView(props: KalendusWebViewProps) {
    // Source replacement creates a separate lifecycle immediately, before native
    // onLoadStart can arrive. Stale events from the old WebView cannot bind it.
    const key =
        props.htmlSource !== undefined ? `html:${props.htmlSource}` : `asset:${props.assetSource}`;
    return <BridgeDocument key={key} {...props} />;
}

function BridgeDocument(props: KalendusWebViewProps) {
    // The published default generic is undefined, which intersects with the
    // WebView props to produce never under strict TypeScript.
    const webViewRef = useRef<WebView<unknown>>(null);
    const sessionRef = useRef<NativeSession | null>(null);
    if (!sessionRef.current) sessionRef.current = new NativeSession();
    const session = sessionRef.current;
    const latest = useRef(props);
    // A native event can arrive during a concurrent render; don't send uncommitted props.
    useLayoutEffect(() => {
        latest.current = props;
    }, [props]);
    const failed = useRef(false);
    const mounted = useRef(true);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [assetURI, setAssetURI] = useState<string | undefined>();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            clearTimeout(timeoutRef.current);
            session.reset();
        };
    }, [session]);

    const source = useMemo(() => {
        if ((props.htmlSource === undefined) === (props.assetSource === undefined))
            return undefined;
        return props.htmlSource !== undefined
            ? { html: props.htmlSource }
            : assetURI
              ? { uri: assetURI }
              : undefined;
    }, [props.htmlSource, props.assetSource, assetURI]);

    const report = useCallback((message: string) => latest.current.onError?.(message), []);
    const send = useCallback(
        (raw: string) => webViewRef.current?.injectJavaScript(injection(raw)),
        [],
    );
    const synchronize = useCallback(() => {
        if (!webViewRef.current || failed.current) return;
        const current = latest.current;
        const calendarProps: KalendusProps = {};
        for (const key of PROP_KEYS) {
            // Reflect avoids pretending an arbitrary indexed union assignment is safe.
            // The complete JSON representation is runtime-validated before injection.
            if (current[key] !== undefined) Reflect.set(calendarProps, key, current[key]);
        }
        const snapshot: Snapshot = {
            props: calendarProps,
            theme: current.theme === undefined ? {} : current.theme,
            navigationRevision: current.navigationRevision,
            capabilities: {
                exportICS: typeof current.onExportICS === 'function',
                entryActivation: typeof current.onEntryActivate === 'function',
            },
        };
        const result = session.synchronize(snapshot);
        if (result.invalid)
            report('Invalid or oversized calendar props/theme; snapshot was rejected');
        if (!result.raw) return;
        send(result.raw);
        if (result.initial) {
            setStatus('ready');
            current.onReady?.();
        }
    }, [session, report, send]);
    // Full replacement semantics include removals. Read the ref again on first ready:
    // no pending-props snapshot can win over more recent renders.
    useEffect(() => {
        synchronize();
    });

    const handleMessage = useCallback(
        (event: WebViewMessageEvent) => {
            if (!mounted.current || failed.current) return;
            const msg = session.receive(event.nativeEvent.data);
            if (!msg) return;
            const cb = latest.current;
            switch (msg.type) {
                case 'ready':
                    clearTimeout(timeoutRef.current);
                    synchronize();
                    break;
                case 'error':
                    // A missing bundle/render failure must not leave a successful-ready
                    // document or an endless loading spinner behind.
                    failed.current = true;
                    clearTimeout(timeoutRef.current);
                    session.reset();
                    setStatus('error');
                    setErrorMessage(msg.message);
                    report(msg.message);
                    break;
                case 'event':
                    switch (msg.name) {
                        case 'calendar-state-change':
                            cb.onCalendarStateChange?.(msg.detail);
                            break;
                        case 'entries-invalid':
                            cb.onEntriesInvalid?.(msg.detail);
                            break;
                        case 'entry-activate':
                            cb.onEntryActivate?.(msg.detail);
                            break;
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
        },
        [session, synchronize, report],
    );
    const reset = useCallback(() => {
        clearTimeout(timeoutRef.current);
        session.reset();
        failed.current = false;
        setErrorMessage('');
        setStatus('loading');
    }, [session]);
    const loadError = useCallback(
        (message: string) => {
            clearTimeout(timeoutRef.current);
            session.reset();
            failed.current = true;
            setStatus('error');
            setErrorMessage(message);
            report(message);
        },
        [session, report],
    );
    useEffect(() => {
        if ((props.htmlSource === undefined) === (props.assetSource === undefined)) {
            loadError('Provide exactly one trusted htmlSource or assetSource');
            return;
        }
        if (props.assetSource === undefined) return;
        let cancelled = false;
        const module = props.assetSource;
        void (async () => {
            try {
                if (!Number.isSafeInteger(module) || module <= 0) throw new Error('Invalid module');
                const asset = await Asset.fromModule(module).downloadAsync();
                if (!asset.localUri || new URL(asset.localUri).protocol !== 'file:') {
                    throw new Error('Asset download did not produce a local file URI');
                }
                if (!cancelled) setAssetURI(asset.localUri);
            } catch {
                if (!cancelled) loadError('Unable to resolve/download the calendar HTML asset');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [props.htmlSource, props.assetSource, loadError]);
    return (
        <View style={[{ flex: 1 }, props.style]}>
            {source !== undefined && (
                <WebView<unknown>
                    ref={webViewRef}
                    source={source}
                    onMessage={handleMessage}
                    onLoadStart={reset}
                    onLoadEnd={() => {
                        if (failed.current || session.document !== null) return;
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = setTimeout(
                            () =>
                                loadError(
                                    'Calendar bridge handshake timed out; check that the wrapper and shell artifacts match',
                                ),
                            20000,
                        );
                        send(session.connect());
                    }}
                    onError={(event) => loadError(event.nativeEvent.description)}
                    onHttpError={(event) =>
                        loadError(`Calendar HTTP load failed (${event.nativeEvent.statusCode})`)
                    }
                    onContentProcessDidTerminate={() =>
                        loadError('Calendar WebView process terminated; remount to retry')
                    }
                    onRenderProcessGone={() =>
                        loadError('Calendar WebView renderer exited; remount to retry')
                    }
                    // Inline HTML needs '*' in RN WebView's originWhitelist. This is NOT
                    // navigation authorization: the explicit URL check below is the boundary.
                    originWhitelist={['*']}
                    onShouldStartLoadWithRequest={(request) =>
                        request.url === 'about:blank' ||
                        (assetURI !== undefined && request.url === assetURI)
                    }
                    onOpenWindow={() => {
                        /* Do not open new browsing contexts or external apps. */
                    }}
                    javaScriptEnabled
                    // Only the self-contained downloaded asset needs local-file loading.
                    // No universal/file-origin fetch access or sibling directory grant.
                    allowFileAccess={assetURI !== undefined}
                    allowFileAccessFromFileURLs={false}
                    allowUniversalAccessFromFileURLs={false}
                    allowingReadAccessToURL={assetURI}
                    domStorageEnabled={false}
                    scrollEnabled
                    bounces={false}
                    overScrollMode="never"
                    style={{ flex: 1, backgroundColor: 'transparent' }}
                    containerStyle={{ flex: 1 }}
                />
            )}
            {props.showLoadingIndicator !== false && status === 'loading' && (
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        { justifyContent: 'center', alignItems: 'center' },
                    ]}
                    accessibilityLabel="Loading calendar"
                    accessibilityLiveRegion="polite"
                >
                    <ActivityIndicator size="large" />
                </View>
            )}
            {status === 'error' && <Text accessibilityRole="alert">{errorMessage}</Text>}
        </View>
    );
}
export default KalendusWebView;
