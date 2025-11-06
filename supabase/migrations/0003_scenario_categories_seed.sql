-- Add category to scenarios and seed Ghana-specific cases
alter table if exists scenarios add column if not exists category text;

insert into scenarios (title, summary, difficulty, law_type, category, sample_evidence)
values
(
  'Breach of Contract: Kofi v. Adwoa',
  'Kofi alleges Adwoa breached a sales agreement for 500 bags of cement. Dispute over whether time was of the essence and whether part-payment altered obligations.',
  'Medium',
  'Contract (Civil)',
  'Civil',
  '{"agreement_date":"2023-05-10","price_per_bag":85,"part_payment":2000,"messages":["WhatsApp confirmations"],"receipt_numbers":["RC-0021","RC-0022"]}'::jsonb
),
(
  'Theft under Criminal Code: Republic v. Kwame',
  'Kwame is charged with theft of a motorbike under the Criminal Offences Act, 1960 (Act 29). Dispute over intent to permanently deprive and ownership.',
  'Medium',
  'Criminal (Act 29)',
  'Criminal',
  '{"complainant":"Yaw Mensah","item":"Bajaj Boxer","police_report":"CID/ACCRA/2024/112","witnesses":["Neighbour","Mechanic"]}'::jsonb
),
(
  'Defamation: Akua v. The Daily Sun',
  'Akua sues a tabloid for publishing allegations of fraud. Issues: defamatory meaning, reference to plaintiff, publication, defenses including fair comment and qualified privilege.',
  'Hard',
  'Tort (Defamation)',
  'Civil',
  '{"article_url":"https://example.com/article","social_shares":1240,"retraction":"none","damages_claimed":50000}'::jsonb
),
(
  'Trespass to Land: Nana v. Yaa',
  'Boundary dispute in Eastern Region. Nana alleges Yaa encroached on family land; survey plan and customary grant at issue.',
  'Medium',
  'Property / Land',
  'Civil',
  '{"site_plan_ref":"SP-ER-2022-778","customary_grant":"1978 family grant","witnesses":["Family head","Surveyor"]}'::jsonb
),
(
  'Assault: Republic v. Kojo',
  'Charge of assault and causing harm during a marketplace fight. Issues: identification, intent, and lawful excuse/self-defence.',
  'Easy',
  'Criminal (Act 29)',
  'Criminal',
  '{"medical_report":"POLY-2024-33","CCTV":"market_gate_cam","weapon":"bottle"}'::jsonb
),
(
  'Intestate Succession: In re Estate of Mensah',
  'Dispute under PNDC Law 111 on distribution among surviving spouse, children, and customary family.',
  'Medium',
  'Family / Succession (PNDCL 111)',
  'Civil',
  '{"deceased":"K. Mensah","assets":["House-Teshie","Bank Acct"],"survivors":["Spouse","3 children","Brother"]}'::jsonb
),
(
  'Fundamental Human Rights: Article 21 Assembly Permit',
  'Applicants challenge refusal of assembly permit citing 1992 Constitution Article 21(1)(d) and Public Order Act compliance.',
  'Hard',
  'Constitutional Law',
  'Constitutional',
  '{"application_ref":"POA-2024-09","police_response":"refused","notice_days":3}'::jsonb
);


