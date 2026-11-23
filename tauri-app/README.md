# Dayly

Aplicación de escritorio de lista de tareas creada con Tauri, React y TypeScript.

## Desarrollo y compilación

```powershell
npm ci
npm run tauri dev
npm run tauri build
```

El instalador de Windows se genera en `src-tauri/target/release/bundle/nsis/`.

## Publicar una actualización

Dayly busca versiones en [GitHub Releases](https://github.com/JJBars/TO-DO-LIST/releases). El actualizador verifica la firma criptográfica antes de instalar. La clave privada se guarda localmente en `%USERPROFILE%\.tauri\dayly.key`; nunca la subas al repositorio ni a GitHub.

Para publicar una versión:

1. Actualiza la versión en `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` y `package.json`.
2. Construye el instalador firmado desde esta carpeta:

   ```powershell
   $env:TAURI_SIGNING_PRIVATE_KEY = "$env:USERPROFILE\.tauri\dayly.key"
   npm run tauri build
   ```

3. Genera el manifiesto para la etiqueta de esta versión, por ejemplo `v0.2.0`:

   ```powershell
   .\scripts\create-updater-manifest.ps1 -Tag v0.2.0
   ```

4. En GitHub, crea una Release pública con esa misma etiqueta y sube estos tres archivos desde `src-tauri/target/release/bundle/nsis/`:
   - `Dayly_<versión>_x64-setup.exe`
   - `Dayly_<versión>_x64-setup.exe.sig`
   - `latest.json`

El manifiesto apunta al instalador de esa Release. La Release debe publicarse para que la app pueda detectarla. La primera versión que incluya el actualizador debe instalarse manualmente; las versiones posteriores se podrán instalar desde Dayly.
