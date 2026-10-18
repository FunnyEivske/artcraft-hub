; NSIS installer and uninstaller hooks for OpenArt Hub

!macro NSIS_HOOK_PREINSTALL
!macroend

!macro NSIS_HOOK_POSTINSTALL
!macroend

!macro NSIS_HOOK_PREUNINSTALL
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ; Ask user if they wish to clean up application settings and WebView2 caches
  IfSilent clean_data
  MessageBox MB_YESNO|MB_ICONQUESTION "Vil du også fjerne appens innstillinger, søkehistorikk og hurtiglager?$\r$\n(Dine egne prosjekt- og kunstfiler i Dokumenter/OpenArt blir IKKE slettet)" IDNO keep_data

  clean_data:
    ; Remove WebView2 / Tauri cache and localStorage
    RMDir /r "$LOCALAPPDATA\com.artcraft.hub"
    RMDir /r "$APPDATA\com.artcraft.hub"
    ; Remove hub scanner settings and cache
    RMDir /r "$PROFILE\ArtCraftHub\Settings"
    Delete "$PROFILE\ArtCraftHub\installed_versions.json"

  keep_data:
!macroend
