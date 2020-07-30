# FolderMonitor v1.0.1

Electron app that automates asset roundtrip between two systems (DTI and Claro) and their hotfolders. Tailor made for Obrada Fotografija department in Styria Hrvatska (hardcoded folder paths).

# Što radi aplikacija?

App prati stanje u lokalnom folderu `📂 My Documents\_claro automatika\`, te kada se pojave nove fotke, kopira ih u `📂 \\srvczg-files\ftp_claro\CRO\IN\`. Također prati i `📂 \\srvczg-files\ftp_claro\CRO\OUT\<username>\` te sve slike koje claro vrati automatski kopira u `📂 C:\LoginApp\Refresh News Media\`. Ujedno i prikazuje koliko slika ima u kojem folderu.

Klikom na jedan od brojeva (na slici su nule, jer su folderi prazni bili u tom trenutku) otvara se taj folder u windows exploreru

![FolderMonitor app](./readme/app.png 'FolderMonitor app')

# Instalacija

1. Instalacijski file se nalazi na adresi: [releases/](https://github.com/trogulja/FolderMonitor/releases), a zadnja verzija je: [FolderMonitor-1.0.1.Setup.exe](https://github.com/trogulja/FolderMonitor/releases/download/1.0.1/FolderMonitor-1.0.1.Setup.exe)
2. Downloadate taj file i pokrenete ga - nije potreban administrator
3. Nakon instalacije imate novi shortcut na desktopu s imenom FolderMonitor

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

**Prva pomoć**: *potrebno je nanovo dohvatiti taj file i pustiti ga u workflow.*

Primjer kako izgleda strgan jpg file:

![Primjer JPEG Strgan](./readme/primjer-strgan.jpg 'Primjer JPEG Strgan')

Odnosno, isti taj file kako bi trebao izgledati:

![Primjer JPEG OK](./readme/primjer.jpg 'Primjer JPEG OK')

### 2. Folderi se ne prazne

U određenim, rijetkim, slučajevima je moguće da aplikacija ne uspije prebaciti file iz foldera u folder. Slike ostanu "*visiti*" u tim folderima... 🔥

**Prva pomoć**: *potrebno je ugasiti i ponovno upaliti aplikaciju, pa će kopiranje krenuti.*