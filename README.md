# VOX Panel for Premiere Pro

VOICEVOX Engineで音声を作成し、Premiere Proのプロジェクトやタイムラインに追加するUXPパネルです。

開発者：**yonemoti**

## 主な機能

- VOICEVOXの話者とスタイルを読み込み
- 読み上げテキスト、話速、音高、抑揚、音量、開始・終了の無音を設定
- 数値の直接入力やマウスドラッグで調整し、各設定をリセット
- パネル内で試聴してから音声を再生成
- WAVをPremiere Proに読み込み、アクティブシーケンスの再生ヘッド位置に追加

## 動作環境

- Adobe Premiere Pro 25.6以降（26.xを中心に開発）
- VOICEVOXデスクトップアプリを起動し、Engine APIを利用できる状態にすること
- UXP Developer Tool（UDT）。プラグインの読み込みに使用します

macOS上のPremiere Pro 26.5.2で動作を確認しています。Windowsでは未検証です。

## インストール

このリポジトリには、UDTで作成した`.ccx`インストーラーはまだありません。現在はソースをダウンロードしてUDTから読み込んでください。

1. GitHubの **Code → Download ZIP** からソースをダウンロードし、展開します。
2. UDTで **Add Plugin（プラグインを追加）** を選び、展開したフォルダ内の`manifest.json`を指定します。
3. プラグインの **Load（読み込み）** を押します。
4. Premiere Proで **ウィンドウ → UXPプラグイン → VOX Panel** を開きます。

`.ccx`ファイルで簡単にインストールできるようにするには、UDTの **… → Package（パッケージ）** から作成したパッケージをGitHub Releasesに追加します。ZIPファイルの拡張子を`.ccx`に変えるだけでは作成できません。詳しくは[Adobeのパッケージ作成手順](https://developer.adobe.com/premiere-pro/uxp/plugins/distribution/package/)を参照してください。

## 使い方

1. VOICEVOXを起動し、パネル上部の接続ボタンを押します。
2. 読み上げテキストを入力し、すぐ下の**試聴**を押します。
3. プレーヤーの**▶ 再生**で音声を確認します。話速・音高・抑揚・音量の数値を直接変えるには、値をダブルクリックします。
4. **再生成してPremiereに追加**を押して保存先を選びます。WAVが保存され、Premiere ProのプロジェクトとアクティブシーケンスのA1に追加されます。

## 接続先とプライバシー

テキストと音声のリクエストは、同じコンピューター上のVOICEVOX Engine（`127.0.0.1:50021`または`localhost:50021`）に送信されます。プラグインはこの2つのローカル接続先以外へのリクエストを拒否します。

Premiere Pro 26.xの開発環境でローカル接続だけを指定する設定が機能しなかったため、マニフェストではUXPのネットワーク許可を広く要求しています。実際の接続先はプラグイン側で上記のローカル接続先に制限しています。気になる場合は、インストール前に`main.js`と`manifest.json`を確認してください。

生成したWAVはユーザーが選んだフォルダに保存します。試聴用WAVはUXPの一時フォルダに保存します。

## 困ったときは

- 接続できない場合は、VOICEVOXが起動していることとEngine APIが`http://127.0.0.1:50021`で利用できることを確認してください。
- パネルが接続できない場合は、VOICEVOXのEngine/API設定とローカルアプリの通信許可を確認してください。
- 音声を追加できない場合は、Premiere Proでプロジェクトを開き、追加先のシーケンスをアクティブにしてから実行してください。
- 現在はCreative Cloud Marketplaceを通さない配布方法です。

## ライセンス

MITライセンスです。詳細は[LICENSE](LICENSE)を確認してください。

## VOICEVOXの利用について

このパネルはVOICEVOX Engine APIを利用します。VOICEVOXや各キャラクター、生成音声にはそれぞれ利用規約やクレジット表記の条件があります。[VOICEVOX利用規約](https://voicevox.hiroshiba.jp/term/)と使用するキャラクターの利用条件を確認してください。
