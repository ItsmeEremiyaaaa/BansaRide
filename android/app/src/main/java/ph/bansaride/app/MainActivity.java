package ph.bansaride.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // The phone's font-size setting also stretches the app's text; a very large setting would push the layouts off the screen, so it stops at 115%.
        WebSettings settings = getBridge().getWebView().getSettings();
        settings.setTextZoom(Math.min(settings.getTextZoom(), 115));
    }
}
