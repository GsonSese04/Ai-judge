-- Add a prose facts column and backfill detailed narratives for Ghana scenarios
alter table if exists scenarios add column if not exists facts text;

-- Backfill facts where title matches seeded examples
update scenarios set facts = (
  'Kofi, a building contractor in Kumasi, entered into a written agreement with Adwoa on 10 May 2023 for the supply of 500 bags of cement at GHS 85 per bag. Kofi paid GHS 2,000 as part-payment. Messages exchanged on WhatsApp referred to delivery "next Friday" because Kofi''s site would be ready. On the agreed week, Adwoa delivered 150 bags and indicated that the supplier had increased prices and trucks were unavailable. Kofi insists time was essential because the foundation work had to be completed before the rains. He claims he sourced the balance elsewhere at a higher price and suffered delays. Adwoa contends that Kofi accepted late part-deliveries and therefore varied the agreement, and that price increments were communicated.')
where title = 'Breach of Contract: Kofi v. Adwoa';

update scenarios set facts = (
  'Kwame is alleged to have taken a neighbour''s Bajaj Boxer motorbike from a shared courtyard one evening, saying he was taking it to a mechanic to fix a faulty plug. The owner, Yaw Mensah, reported to police the next morning when the bike was not returned. Two days later the bike was found at a mechanic''s shop with the plug replaced. Kwame claims Yaw had previously allowed him to ride short errands and he intended to return it after diagnosis. A neighbour saw Kwame wheel the bike away but did not hear any permission being granted that night. The dispute centres on intention to permanently deprive and ownership/consent.')
where title = 'Theft under Criminal Code: Republic v. Kwame';

update scenarios set facts = (
  'The Daily Sun tabloid published a front-page story naming Akua, a mid-level banker, as being "at the centre of a fraud ring". The article cited unnamed sources and did not contact Akua prior to publication. The story was widely shared on social media and discussed on morning radio. Akua maintains the story is entirely false, that she suffered suspension from work and reputational damage, and that no retraction or apology has been issued. The paper argues it acted in the public interest, relied on credible sources, and the piece amounted to fair comment. The issues are defamatory meaning, reference, publication, and defences including qualified privilege and fair comment.')
where title = 'Defamation: Akua v. The Daily Sun';

update scenarios set facts = (
  'Nana and Yaa are adjoining landowners in a peri-urban area of the Eastern Region. Nana claims Yaa moved boundary pillars by about 8 feet and constructed a fence onto family land granted to Nana under customary law in 1978. A licensed surveyor produced a site plan (SP-ER-2022-778) supporting Nana''s coordinates, while Yaa tenders a different plan issued after a recent subdivision. The family head confirms an old boundary marked by an odum tree, now felled. The dispute concerns title, trespass, and the evidential weight of site plans and customary grants.')
where title = 'Trespass to Land: Nana v. Yaa';

update scenarios set facts = (
  'A fight broke out at the Kaneshie Market between Kojo and another trader following a dispute over change. Witnesses say Kojo struck the complainant with a glass bottle causing a cut to the forehead. CCTV from a nearby shop shows a scuffle but the striking motion is partially obscured. Kojo claims he acted in self-defence after being pushed and threatened. A medical report confirms lacerations requiring stitches. The issues are identification, intent, and whether lawful excuse/self-defence applies under Act 29.')
where title = 'Assault: Republic v. Kojo';

update scenarios set facts = (
  'Upon the death of K. Mensah intestate, surviving relatives include a spouse, three children and a brother. The estate comprises a house at Teshie and funds in a bank account. The brother asserts the house is a family property and should revert to the customary family. The spouse seeks distribution under PNDCL 111, including household chattels. There is no evidence of a will. The dispute requires application of the statutory scheme, identification of self-acquired property, and any customary law claims.')
where title = 'Intestate Succession: In re Estate of Mensah';

update scenarios set facts = (
  'Applicants notified the police three days in advance of their intention to hold a public assembly in the city centre to protest utility tariffs. The police refused the permit, citing inadequate personnel and potential disruption to traffic. Applicants contend the refusal violates Article 21(1)(d) of the 1992 Constitution and that they complied with the Public Order Act. They propose a revised route and marshals. The State argues the refusal was a reasonable restriction necessary in a democratic society. The case raises the balance between freedom of assembly and public order.')
where title = 'Fundamental Human Rights: Article 21 Assembly Permit';


