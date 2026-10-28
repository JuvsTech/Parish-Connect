# Mga Paglalarawan sa mga Diagram ng Parish Connect

Inilalarawan ng dokumentong ito ang mga pangunahing entity at proseso sa mga diagram ng Parish Connect. Maaari itong gamitin bilang paliwanag o caption sa system documentation at thesis. Ang ERD sa ibaba ay konseptuwal na modelo batay sa ipinakitang diagram; maaaring magkaiba ang ilang field o ugnayan sa aktuwal na Firestore implementation.

## Entity-Relationship Diagram (ERD)

Ipinapakita ng ERD ang mga pangunahing uri ng datos na ginagamit sa parish records system at kung paano nauugnay ang mga ito. Ang solidong linya ay kumakatawan sa confirmed foreign key, samantalang ang dashed na linya ay nagpapakita ng logical reference.

| Entity | Paglalarawan |
|---|---|
| **USERS** | Naglalaman ng impormasyon ng mga account na gumagamit ng system, gaya ng email, display name, at role. Ginagamit ang role upang makilala ang antas ng access ng account. |
| **AUDIT_LOGS** | Nagtatala ng mahahalagang aktibidad sa system, kasama ang gumawang user, aksiyon, module, at oras. Nakaugnay ang bawat log sa user na nagsagawa ng aktibidad. |
| **BAPTISM** | Nag-iimbak ng detalye ng binyag gaya ng pangalan ng bata, petsa ng binyag, at ministro. Maaari itong iugnay sa isang calendar event sa pamamagitan ng logical reference. |
| **CONFIRMATION** | Nag-iimbak ng pangalan ng taong tumanggap ng kumpil, petsa ng kumpil, at ministro. Maaari rin itong iugnay sa event para sa iskedyul nito. |
| **MARRIAGE** | Naglalaman ng pangalan ng mag-asawa, petsa ng kasal, at ministro. Ang kaugnay na event ay tumutukoy sa rekord ng kasal na pinagmulan nito. |
| **DEATH** | Nag-iimbak ng pangalan ng yumao, petsa ng pagkamatay, at ministro o tagapangasiwa ng serbisyo. Maaari itong magkaroon ng kaugnay na calendar event. |
| **CONVERSION** | Naglalaman ng pangalan ng taong nagbalik-loob, petsa ng conversion, at tumanggap na ministro. Maaari itong iugnay sa event para sa iskedyul. |
| **EVENTS** | Nag-iimbak ng pamagat, petsa, oras, pinagmulan, at identifier ng kaugnay na rekord para sa mga item sa parish calendar. Ang `source` ang nagsasaad kung aling uri ng rekord ang tinutukoy ng `relatedRecordId`—halimbawa, baptism, marriage, o mass intention. Dahil magkakaibang koleksiyon ang maaaring pagkunan ng reference, logical reference ito at hindi iisang karaniwang foreign key. |
| **MASS_INTENTIONS** | Naglalaman ng kahilingan o tala para sa intensiyon sa Misa, kasama ang intensiyon, petsa ng Misa, at celebrant. Maaari itong maiugnay sa event sa kalendaryo at sa minister na nakatalaga rito. |
| **MINISTERS** | Nag-iimbak ng pangalan, titulo, at status ng mga pari o ministro na maaaring italaga sa mga serbisyo o intensiyon sa Misa. |
| **REPORTS** | Naglalaman ng metadata ng mga ginawang ulat gaya ng pangalan at uri ng ulat, gumawa nito, at petsa ng pagbuo. Inilalarawan ng diagram ang tala ng ulat, hindi ang mismong laman o snapshot ng bawat resulta. |

Sa ipinakitang ugnayan, maaaring magkaroon ang isang user ng maraming audit log. Ang mga sakramental na rekord at mass intention ay maaaring magkaroon ng kaugnay na event; ang `source` at `relatedRecordId` ang magkasamang tumutukoy sa pinanggalingang uri at rekord. Ang mass intention ay maaari ring tumukoy sa isang minister. Ang mga dashed na ugnayan ay nagpapahiwatig na kailangang isaalang-alang ng application ang uri ng source bago hanapin ang kaugnay na rekord.

## Paliwanag sa mga flowchart

### Overall System Flowchart

Inilalarawan ng flowchart ang pangunahing daloy mula pagbukas ng Parish Connect hanggang pagpasok sa mga module. Tinitingnan muna kung naka-sign in na ang user. Kung hindi, hinihingi ang email at password at bineberipika ang mga kredensiyal; kung oo, nilo-load ang profile ng account. Sinusuri rin kung matagumpay na nabasa ang profile at kung aktibo at awtorisado ang account. Kapag pumasa sa mga pagsusuri, dadalhin ang user sa dashboard kung saan maaaring pumili ng calendar, sacramental records, archived records, mass intentions, ministers, reports, profile, o logout. Ipinapakita rin ng mga sangay ng flowchart ang pagbalik sa login kapag hindi awtorisado ang account o may error sa pag-load.

### Sacramental Records Flowchart

Ipinapakita ng flowchart ang karaniwang pamamahala sa Baptism, Confirmation, Marriage, Death, at Conversion records. Mula sa napiling module, nilo-load at maaaring hanapin o salain ang mga rekord. Maaaring magdagdag, tumingin, mag-edit, o mag-archive ang user. Sa pagdagdag, maaaring magsimula sa calendar schedule o magbukas ng form para sa historical/old record; sinusuri ang kinakailangang impormasyon bago i-save. Sa pagtingin, maaaring buksan ang detalye at dumaan sa certificate flow kung gagawa ng sertipiko. Sa pag-edit, muling bineberipika ang kasalukuyang password at sinusuri ang mga field bago i-save. Sa pag-archive, ipinapakita ang detalye, hinihingi ang dahilan at password, at inililipat ang rekord sa archive matapos pumasa sa mga pagsusuri. Pagkatapos ng bawat gawain, babalik ang user sa listahan ng parehong module.

### Archive and Recovery Flowchart

Inilalarawan nito ang dalawang gawain para sa mga rekord na naka-archive: pag-archive at pagbawi. Sa pag-archive, pipili ng rekord, maglalagay ng dahilan, at ibeberipika ang password. Sinusuri kung naka-archive na ito bago i-update ang archive status, oras, at dahilan. Sa recovery, pipili ng archived record, maglalagay ng recovery reason, at muling ibeberipika ang password. Tinitiyak munang naka-archive ang rekord bago alisin ang archive status at itala ang oras at dahilan ng pagbawi. Nagpapakita ang flowchart ng error kapag hindi tama ang password o hindi naaangkop ang kasalukuyang status, at ng success message kapag naisagawa ang update.

## Paliwanag sa Use-Case Diagram

Ipinapakita ng use-case diagram ang dalawang pangunahing aktor—**Parish Secretary** at **Parish Priest**—at ang mga bahagi ng system na inilalarawang naa-access nila: login, dashboard, sacramental records, archived records, mass intentions, marriage ministers, reports, profile, at about. Ipinahihiwatig ng mga linya ang pakikilahok ng mga aktor sa mga use case. Hindi inilalarawan ng diagram ang pagkakaiba ng pahintulot ng bawat role; para sa aktuwal na access rules, sumangguni sa kasalukuyang system implementation.

## Mga mungkahing caption

- **Figure 6. Entity-Relationship Diagram ng Parish Connect.** Ipinapakita nito ang mga pangunahing entity ng parish record management system at ang kanilang confirmed foreign key o logical reference.
- **Figure 7. Overall System Flowchart.** Ipinapakita nito ang authentication, account authorization, at pagpasok sa mga pangunahing module.
- **Figure 8. Sacramental Records Flowchart.** Ipinapakita nito ang pagdaragdag, pagtingin, pag-edit, at pag-archive ng mga sakramental na rekord.
- **Figure 9. Archive and Recovery Flowchart.** Ipinapakita nito ang beripikasyon at mga hakbang sa pag-archive at pagbawi ng rekord.
- **Figure 10. Use-Case Diagram ng Parish Connect.** Ipinapakita nito ang mga pangunahing aktor at ang mga functionality na inilalarawan sa system.
