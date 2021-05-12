# Što radi aplikacija?

App prati stanje u lokalnom folderu `📂 My Documents\_claro automatika\`, te kada se pojave nove fotke, kopira ih u `📂 \\srvczg-files\ftp_claro\CRO\IN\`. Također prati i `📂 \\srvczg-files\ftp_claro\CRO\OUT\<username>\` te sve slike koje claro vrati automatski kopira u `📂 C:\LoginApp\Refresh News Media\`. Ujedno i prikazuje koliko slika ima u kojem folderu.

Klikom na jedan od brojeva (na slici su nule, jer su folderi prazni bili u tom trenutku) otvara se taj folder u windows exploreru

![FolderMonitor app](./readme/app.png 'FolderMonitor app')

# Instalacija

1. Instalacijski file se nalazi na adresi: [releases/](https://github.com/trogulja/FolderMonitor/releases), a zadnja verzija je: [FolderMonitor-1.0.11.Setup.exe](https://github.com/trogulja/FolderMonitor/releases/download/1.0.11/FolderMonitor-1.0.11.Setup.exe)
2. Downloadate taj file

   - zbog zaštite od downloadanja .exe fileova, moguće je da se pojavi upozorenje:

   ![Download warning](./readme/download_warning1.jpg 'Download warning')

   - pa je potrebno odabrati "keep" opciju da se file ipak spremi lokalno:

   ![Download warning keep](./readme/download_warning2.jpg 'Download warning keep')

3. Pokrenite instalacijski file - nije potreban administrator

   - no moguće je da windowsi neće odmah dopustiti instalaciju, već će pitati za dozvolu - potrebno je kliknuti na advanced, pa zatim na Run anyway:

   ![Install protection](./readme/install_protection.jpg 'Install protection')

4. Nakon instalacije imate novi shortcut na desktopu s imenom FolderMonitor

# Kako koristiti app?

### 1. Pokreni app

![Shortcut Icon](./readme/shortcut.png 'Shortcut Icon')

- Pokreni shortcut na Desktopu pod imenom: "FolderMonitor"
- ili navigiraj do `📂 C:\Users\<username>\AppData\Local\foldermonitor` i tamo dvoklik na "FolderMonitor.exe".

### 2. Export iz DTIa

- Iz DTIa treba exportirati fajlove (ctrl + e):

  ![Export Button](./readme/export_button.png 'Export Button')

- u `📂 My Documents\_claro automatika\` folder.

  ![Export Options](./readme/export_options.png 'Export Options')

### 3. Daljnji koraci

- sljedeći korak je standardni rad s claro inspektorom
- to je to, nema dalje... aplikacija sama radi i brine se da fajlovi završe u folderima u kojima trebaju bit

# Moguće greške

### 1. Pucanje fajlova

Zbog specifičnosti naše mreže, moguće je da u nekim rijetkim slučajevima dođe do pucanja jpeg fajlova. Trenutna verzija je to trebala popraviti, no testiranje na jako velikom broju fajlova s velikim opterećenjem nije napravljeno, pa molim da se na to pripazi i obavezno da se prijave sve puknute slike (ako se primjete)! 🔥🔥🔥

**Prva pomoć**: _potrebno je nanovo dohvatiti taj file i pustiti ga u workflow._

Primjer kako izgleda strgan jpg file:

![Primjer JPEG Strgan](./readme/primjer-strgan.jpg 'Primjer JPEG Strgan')

Odnosno, isti taj file kako bi trebao izgledati:

![Primjer JPEG OK](./readme/primjer.jpg 'Primjer JPEG OK')

### 2. Folderi se ne prazne

U određenim, rijetkim, slučajevima je moguće da aplikacija ne uspije prebaciti file iz foldera u folder. Slike ostanu "_visiti_" u tim folderima... 🔥

**Prva pomoć**: _potrebno je ugasiti i ponovno upaliti aplikaciju, pa će kopiranje krenuti._

