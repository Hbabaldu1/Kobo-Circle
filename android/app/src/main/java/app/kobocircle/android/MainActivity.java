package app.kobocircle.android;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String PRODUCTION_HOST = "kobo-circle.vercel.app";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        openTrustedDeepLink(getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        openTrustedDeepLink(intent);
    }

    /**
     * Only Kobo Circle HTTPS links can be loaded in the WebView. Capacitor opens
     * all other destinations (including wa.me) with Android's external intent,
     * so WhatsApp uses its installed native app instead of this WebView.
     */
    private void openTrustedDeepLink(Intent intent) {
        Uri link = intent.getData();
        if (link == null || !"https".equals(link.getScheme()) || !PRODUCTION_HOST.equals(link.getHost()) || getBridge() == null) {
            return;
        }
        getBridge().getWebView().loadUrl(link.toString());
    }
}
