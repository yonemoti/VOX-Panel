# VOX Panel for Premiere Pro

VOICEVOXのローカルEngineを操作して音声を作り、Premiere Proのプロジェクトとタイムラインに追加するUXPパネルです。

## Features

- VOICEVOXの話者・スタイルを読み込み
- テキスト、話速、音高、抑揚、音量、開始/終了無音を指定
- パラメータのリセット、数値の直接入力、マウスドラッグでの調整
- パネル内で試聴して再生成
- WAVをPremiereプロジェクトへ読み込み、アクティブシーケンスの再生ヘッド位置へ追加

## Requirements

- Adobe Premiere Pro 25.6以降（26.xを中心に開発）
- VOICEVOXデスクトップアプリを起動し、Engine APIを利用可能にしておくこと
- Adobe Creative Cloud Desktop（`.ccx`インストーラーの導入に使用）

このプロジェクトはmacOS上のPremiere Pro 26.5.2で利用確認しています。Windowsは未検証です。

## Install from source

このリポジトリの初回公開には、UDTで作成した`.ccx`インストーラーはまだ添付されていません。現時点では、ソースを取得してUXP Developer Tool (UDT)から読み込んでください。

1. GitHubの **Code → Download ZIP** からソースをダウンロードして展開します。
2. UDTで **Add Plugin** を選び、展開したフォルダ内の`manifest.json`を指定します。
3. プラグイン行の **Load** を押します。
4. Premiere Proで **ウィンドウ → UXPプラグイン → VOX Panel** を開きます。

`.ccx`による簡単なインストールは、UDTの **… → Package** でパッケージを作成し、GitHub Releasesに追加した後に利用できます。Marketplace外からのプラグインである旨の確認が表示される場合があります。ソースを確認してからインストールしてください。

## Use

1. 読み上げテキストを入力し、すぐ下の**試聴**を押します。
2. プレーヤーの**▶ 再生**で音声を確認します。数値を直接変えるには、話速・音高・抑揚・音量の値をダブルクリックします。
3. **再生成してPremiereに追加**を押して保存先を選びます。
4. WAVが保存され、PremiereプロジェクトとアクティブシーケンスのA1に追加されます。

## Build a `.ccx` package

For plugin maintainers:

1. Install Adobe UXP Developer Tool (UDT).
2. In UDT, choose **Add Plugin** and select this folder's `manifest.json`.
3. In the plugin row's **…** menu, select **Package**, then choose an output folder.
4. Install the generated `.ccx` locally and verify it in Premiere before attaching it to a GitHub Release.

Do not create the `.ccx` by simply renaming a ZIP. Adobe recommends packaging through UDT. See [Adobe's packaging guide](https://developer.adobe.com/premiere-pro/uxp/plugins/distribution/package/).

## Privacy and permissions

VOICEVOX text and audio requests stay on the local machine and are sent to the local Engine at `127.0.0.1:50021` or `localhost:50021`. The plugin validates the URL and rejects other hosts and ports.

The manifest currently requests UXP network access broadly because Premiere 26.x did not honor the loopback-only domain entry in the development environment used for testing. The plugin code only constructs requests from the two local Engine URLs above. Review `main.js` and `manifest.json` before installing if you want to verify this behavior.

Generated WAV files are saved only to a folder selected by the user. Preview WAVs are written to UXP's temporary folder.

## Troubleshooting

- Ensure VOICEVOX is running and its Engine API is available at `http://127.0.0.1:50021`.
- If the panel cannot connect, check the VOICEVOX Engine/API settings and its local-app/CORS permissions.
- If audio is not added, open a Premiere project and make the target sequence active before pressing **再生成してPremiereに追加**.
- The current release is independent distribution. It is not listed in the Creative Cloud Marketplace.

## License

MIT. See [LICENSE](LICENSE).

## Credits

This panel uses the VOICEVOX Engine API. VOICEVOX characters and generated voices remain subject to their respective terms and attribution requirements. See [VOICEVOX terms](https://voicevox.hiroshiba.jp/term/) and the selected character's usage rules.
