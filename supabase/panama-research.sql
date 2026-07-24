-- Research de Panama (viaje 17, 18 y 21 de agosto de 2026)
-- Correr en Supabase -> SQL Editor. Actualiza contacto, notas y nota_plan.
-- NO toca el estado del pipeline: eso lo decidis vos.

alter table public.maximus_prospects add column if not exists nota_plan text;
alter table public.maximus_clients   add column if not exists nota_plan text;

insert into public.maximus_prospects (id, empresa, contacto, producto, pais, notas, nota_plan, estado) values
  ('pr_2ac0f1d1b5', 'AV Securities', 'Moises Kopel Mizrachi - Research Analyst', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Casa de valores independiente | AV Financial Group | USD 2.300 millones

Fundada en 2010, es la principal casa de valores independiente de Panamá, con cuatro licencias de la SMV y unos USD 2.300 millones en activos. Tiene plataforma tecnológica propia para negociar, custodiar y estructurar todo tipo de productos financieros. Latinex la premió como Market Champion tres años consecutivos por ser la casa con mayor cantidad de operaciones bursátiles en mercados internacionales. Lanzó AV Total Return, un fondo de renta fija listado en la Bolsa de Valores de Panamá, con cerca de 80% en high yield latinoamericano, 10% en bonos del Tesoro y 10% en acciones de la región.

Compatibilidad con MaximUs: Muy alta (5/5)

A favor:
- USD 2.300 M y líder en operaciones internacionales: es la independiente más grande de la plaza
- Tienen fondo propio (AV Total Return): necesitan ficha técnica y reporte de performance periódico
- Son intensivos en tecnología: no hay que explicarles el valor de una herramienta, ya lo compran
- El contacto es del área de research, aliado natural para nuestro contenido y comparativos

En contra / a validar:
- Su plataforma propia es la bandera comercial: hay que posicionar MaximUs como capa de asesoría y propuesta, nunca como reemplazo
- Moises Kopel es analista, no decisor: hay que pedirle que nos abra la puerta de la mesa comercial

Fuentes: https://avsecurities.com/ | https://elvenezolano.com.pa/av-securities-generar-confianza-y-crecimiento-a-traves-de-relaciones-estrechas-y-oportunidades-financieras/ | https://supervalores.gob.pa/files/Sociedades/Tarifas/AV%20Securities,%20Inc.pdf', 'Angulo de entrada: Entrar por research con nuestro contenido y comparativos, y de ahí escalar a la mesa comercial. Gancho concreto: ficha y reporte del AV Total Return.

Objetivo de la reunion: Retomar y pedir escalamiento a la mesa comercial

A quien contactar:
- Moises Kopel Mizrachi (Research Analyst): Es el contacto que ya tenemos. Perfil técnico: sirve para entrar y para que valide el producto, pero no firma.
- Mesa comercial / gerencia de inversiones (—): Pedirle a Kopel el nombre del responsable comercial en la misma reunión.', 'volver_a_contactar'),
  ('pr_d39d5fe634', 'MMG Bank', 'Victoria', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Banco de licencia general con casa de valores y fiduciaria | MMG Capital Holdings (Bahamas), Grupo Morgan & Morgan

Fundado en 1996 por socios de Morgan & Morgan, uno de los principales estudios legales y financieros de Panamá. Combina licencia bancaria general, casa de valores y fiduciaria. Ofrece cuentas de inversión en Panamá y Bahamas con acceso a instrumentos en varias monedas, custodia y soluciones de cuentas administradas a medida para corporativos. Tiene una mesa dedicada a asesores externos (EAM Desk). MMG Bank & Trust en Bahamas junto con el banco concentran más del 95% de los activos. Corren core bancario Temenos.

Compatibilidad con MaximUs: Muy alta (5/5)

A favor:
- Tienen una mesa de asesores externos (EAM Desk): es un canal directo a decenas de asesores independientes que podrían usar MaximUs
- Banca privada, casa de valores y fiduciaria en la misma casa: varios frentes
- Tienen CIO propio (Alejandro Cifuentes): hay interlocutor técnico que entiende el producto sin traducción
- Ya invierten en tecnología (core Temenos): entienden comprar software

En contra / a validar:
- Banco con tecnología propia y proyectos core en curso: competimos por agenda de TI
- La ''Victoria'' cargada no se pudo identificar en el organigrama público: confirmar apellido y área

Fuentes: https://www.mmgbank.com/investment-solutions/ | https://www.mmgbank.com/our-history/ | https://www.mmgbank.com/corporate-governance/', 'Angulo de entrada: La mesa de EAM. Ofrecer MaximUs como herramienta para los asesores externos que custodian ahí: MMG suma un servicio de valor y nosotros llegamos a varios asesores con una sola venta.

Objetivo de la reunion: Retomar y explorar el EAM Desk como canal

A quien contactar:
- Victoria (Contacto cargado en la plataforma): Sin apellido. Confirmar internamente quién es y en qué área antes de escribir.
- Laidat Castroverde Fernández (Head of EAM Desk): La conversación más interesante de todas: maneja la relación con asesores externos, que son nuestro usuario final.
- Hugo Rodríguez (Vicepresidente de Wealth Management): El dueño del negocio de gestión patrimonial.
- Alejandro Cifuentes (Chief Investment Officer): Interlocutor técnico: si le cierra el proceso de inversión, ayuda a empujar.
- Jorge Morgan (CEO): Escalamiento.', 'volver_a_contactar'),
  ('pr_054f081358', 'Global Bank', 'Irving Becerra - Head of Asset Management (gerente senior de gestión de activos)', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Banco de licencia general con casa de valores subsidiaria | Global Bank Corporation / GB Group

Banco fundado en 1994, el segundo banco privado de capital panameño, con 47 sucursales y una red amplia de canales. Global Valores es su casa de valores, subsidiaria 100%, y administra el Fondo Global de Inversiones. Su catálogo de inversión incluye acciones locales e internacionales, renta fija local e internacional, bonos soberanos y corporativos, fondos mutuos, fondos de cobertura, productos estructurados y fondos de capital privado.

Compatibilidad con MaximUs: Alta (4/5)

A favor:
- El contacto que ya tenemos es literalmente el head de asset management: no hay que buscar interlocutor
- Administran el Fondo Global de Inversiones y publican ficha técnica mensual: es exactamente el output que automatiza MaximUs
- Catálogo amplísimo, hasta capital privado y hedge funds: mucho para proponer y explicar al cliente
- Segundo banco privado de capital panameño: volumen real

En contra / a validar:
- Banco grande: compras formales y agenda de TI propia
- Parte del negocio es mercado local, donde aportamos menos
- Hay que confirmar en qué quedó el contacto previo antes de repetir el pitch

Fuentes: https://www.globalbank.com.pa/global-valores | https://www.globalbank.com.pa/banca-privada/gestion-patrimonial/fondo-global-de-inversiones | https://www.globalbank.com.pa/sites/default/files/media/documentos/ficha-tecnica-fglobal-feb-2026.pdf', 'Angulo de entrada: La ficha técnica y el reporte del Fondo Global de Inversiones, más las propuestas de banca privada. Es el terreno de Becerra y es dolor mensual.

Objetivo de la reunion: Retomar con Becerra — Fondo Global de Inversiones

A quien contactar:
- Irving Becerra (Head of Asset Management, gerente senior de gestión de activos): Contacto ya cargado y con el cargo exacto que necesitamos. Antes pasó por CHF Advisors, CentralCapital Casa de Valores y la propia SMV: conoce la plaza entera.', 'volver_a_contactar'),
  ('pr_4b38ca9672', 'Banistmo', 'Ana María Merizalde', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Banco de licencia general | Vendido en junio de 2026 por Grupo Cibest (ex Bancolombia) a Inversiones Cuscatlán Centroamérica, que pasará a llamarse Grupo Financiero BSC | Más de 3.000 clientes de banca privada en la región

Filial panameña creada en 1973; en 2013 el Grupo Bancolombia compró HSBC Panamá y la renombró Banistmo. Su banca privada atiende más de 3.000 clientes en la región con soluciones locales e internacionales. El negocio de valores se armó en 2016 integrando Valores Bancolombia Panamá y Securities Banistmo, con renta fija, renta variable, fondos mutuos, notas estructuradas, derivados, divisas y apalancamiento. En junio de 2026 el grupo colombiano cerró la venta del banco por unos USD 1.400 millones, pero se quedó con el negocio de valores, que hoy opera separado bajo la marca Cibest Capital Panamá.

Compatibilidad con MaximUs: Media (3/5)

A favor:
- Banca privada grande, más de 3.000 clientes en la región
- El cambio de dueño abre revisión de proveedores y sistemas: es la ventana para entrar
- Ahora son dos puertas en vez de una: el banco bajo el grupo salvadoreño y Cibest Capital con el negocio de valores

En contra / a validar:
- Cambió de dueño hace un mes: durante la transición las decisiones se congelan
- El negocio de valores ya no está dentro del banco, se escindió a Cibest Capital
- Alto riesgo de que el contacto haya cambiado de entidad o de rol en la reorganización

ATENCION: Banistmo cambió de dueño en junio de 2026 y el negocio de valores se escindió a Cibest Capital — verificar dónde quedó el contacto antes de la reunión

Fuentes: https://www.valoraanalitik.com/banistmo-grupo-cibest-integracion-panama/ | https://www.eltiempo.com/amp/economia/sector-financiero/grupo-cibest-completa-la-venta-de-banistmo-y-convierte-a-panama-en-su-plataforma-financiera-regional-3568069 | https://www.banistmo.com/valores/sobre-nosotros | https://www.banistmo.com/personas/banca-privada', 'Angulo de entrada: Antes de la reunión, confirmar dónde quedó Merizalde. Si está en el banco, el tema es banca privada; si pasó a Cibest Capital, el tema es el negocio de valores, que es el que nos interesa.

Objetivo de la reunion: Confirmar dónde quedó el contacto tras la venta y retomar

A quien contactar:
- Ana María Merizalde (Contacto cargado): Es la que ya nos conoce. Primer paso: confirmar si sigue en Banistmo o pasó a Cibest Capital Panamá.
- Aimeé Sentmat de Grimaldo (Presidenta ejecutiva de Banistmo): Referencia institucional; también presidió la junta de la Asociación Bancaria de Panamá.', 'volver_a_contactar'),
  ('pr_c7ffcc68c3', 'Quantum Advisors', 'Guillermo Ameglio - Fundador, director y presidente', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Casa de valores independiente | Independiente, sin grupo bancario

Fundada en 1999, más de 25 años en mercados internacionales. Se define como firma independiente y libre de presiones comerciales. Tres divisiones: asesoría de inversión, gestión de carteras diversificadas según perfil del cliente, y administración de riesgo con coberturas. Opera únicamente con intermediarios y custodios regulados internacionalmente.

Compatibilidad con MaximUs: Muy alta (5/5)

A favor:
- Es exactamente el perfil objetivo: boutique de asesoría con carteras internacionales por perfil de cliente
- Equipo chico (~8): no tienen ni van a construir tecnología propia
- Se venden como independientes y sin conflicto — el argumentario de arquitectura abierta y comparativos les calza
- Gestionan por perfil de riesgo: las estrategias modelo y el rebalanceo les resuelven trabajo diario

En contra / a validar:
- Firma chica: ticket bajo, hay que dimensionar la propuesta
- No publican el equipo en el sitio: hay que entrar directo por Ameglio

Fuentes: https://pa.linkedin.com/in/guillermo-ameglio-9a0b0834 | https://www.quantumadvisorsinc.com/ | https://supervalores.gob.pa/informacion-de-personas-juridicas-o-entes-regulados/', 'Angulo de entrada: Propuesta de inversión y reporte al cliente en minutos, más comparativos de fondos para sostener el discurso de independencia.

Objetivo de la reunion: Presentar MaximUs — propuestas y reporting para carteras por perfil

A quien contactar:
- Guillermo Ameglio (Fundador, director y presidente): Es el que decide. Administración de empresas con especialización en finanzas (University of Portland) y posgrados en finanzas y gestión de activos. Aparece en LinkedIn.
- Rafael Vizuette (Asesor financiero): Vía de entrada más blanda si no responde Ameglio. El dato viene de un directorio comercial, confirmar antes de usarlo.', 'a_contactar'),
  ('pr_b5061b0061', 'Sardona Capital', 'Candelario Santana - CEO', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Casa de valores boutique (modelo suizo) | Sardona International Group (Panamá, Colombia, EE.UU.) | No lo publica

Fundada en 2012 para dar servicio de banca privada y gestión patrimonial con el modelo tradicional suizo. Hace gestión discrecional, asesoría de inversión, asset management y brokerage. Gestión activa con research fundamental bottom-up y visión de largo plazo. Suma planificación patrimonial y sucesoria.

Compatibilidad con MaximUs: Muy alta (5/5)

A favor:
- Gestión discrecional con research propio: necesitan sostener el proceso de inversión con papeles presentables
- Cinco custodios distintos en tres jurisdicciones — el reporte consolidado multi-custodio es dolor puro y es lo que MaximUs resuelve
- Modelo suizo y patrimonios altos: el cliente final exige reporting prolijo
- Grupo con presencia en Colombia y EE.UU.: si entra Panamá, se replica

En contra / a validar:
- Boutique con research propio: pueden sentir que ya tienen resuelto el análisis
- Hay que separar bien qué les damos nosotros y qué ya hacen ellos

Fuentes: https://www.sardona-capital.com/en/ | https://www.mundosocial.net/casa-de-valores-panamena-con-modelo-suizo/', 'Angulo de entrada: Consolidación y reporte único de carteras repartidas entre APEX, StoneX, EFG, Capital Union y Mercantil. Ese es el gancho.

Objetivo de la reunion: Presentar MaximUs — consolidado multi-custodio y reporting discrecional', 'a_contactar'),
  ('pr_34ef6c3e52', 'WINEXCO Securities', 'Luis Alfredo Cercós - Presidente y representante legal (CEO de Inexco)', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Casa de valores | Grupo Inexco (+18 años, wealth & asset manager con negocios en Chile y Venezuela, sede en Panamá) | No publicado

Casa de valores del Grupo Inexco. Inexco le compró el 60% a World Investment Group y hoy tiene el 100%. Ofrece research independiente, asesoría financiera, cotización, ejecución y transferencias. Publica factsheets de estrategias propias, por ejemplo la Estrategia de Asignación Táctica de Activos (ATA) Balanceada. Tiene planes de expansión regional, con México en la mira.

Compatibilidad con MaximUs: Muy alta (5/5)

A favor:
- Corren estrategias modelo propias con factsheet: es literalmente el output que genera MaximUs
- Cuatro custodios internacionales: consolidación y performance por estrategia
- Grupo regional (Chile, Venezuela, México en carpeta): una venta se multiplica
- El contacto cargado es el número uno de la firma

En contra / a validar:
- Si ya arman los factsheets a mano, hay que mostrar el ahorro de tiempo con números
- Ojo: Yariela Samaniego figura en Winexco en operaciones y cumplimiento, y también aparece asociada a Firmus — chequear quién es quién antes de la reunión

Fuentes: https://www.winexco.com/quienesomos | https://supervalores.gob.pa/wp-content/uploads/2021/03/Winexco_Securities.pdf | https://citywire.com/americas/news/panama-firm-sets-out-expansion-plans-with-mexico-next-target/a1019768', 'Angulo de entrada: Automatizar el factsheet y el reporte de performance de sus estrategias modelo, y consolidar IB + UBS + PKB + Interaudi en un solo reporte.

Objetivo de la reunion: Presentar MaximUs — factsheets de estrategias y consolidado multi-custodio', 'a_contactar'),
  ('pr_1d47718b0d', 'Singular Wealth Management', 'Sergi Lucas - CEO', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Casa de valores independiente | Independiente, no afiliada a ningún grupo bancario | USD 600 millones

Casa de valores boutique que creció comprando negocio: adquirió IPG Securities y la cartera de LW Casa de Valores, y con eso llegó a USD 600 millones administrados. Recibió el premio de Latinclear al participante con mayor crecimiento interanual en custodia. Ofrece gestión discrecional para clientes que quieren delegar, servicios institucionales para grandes capitales y una plataforma de trading DIY con acceso a más de 2 millones de productos.

Compatibilidad con MaximUs: Muy alta (5/5)

A favor:
- Crece integrando carteras compradas a otras casas: cada integración necesita análisis de cartera, propuesta y reporte — el momento ideal para entrar
- USD 600 M y sin banco detrás: deciden rápido y pagan por herramienta que les dé escala
- Gestión discrecional: necesitan reporting de performance por estrategia
- Se posicionan como los que más crecen en custodia: van a necesitar industrializar procesos

En contra / a validar:
- Ya tienen plataforma de trading propia: hay que dejar claro que MaximUs no compite con eso, va arriba (propuesta, análisis y reporte)
- En la base figura como ''Singular Bank'' — confirmar que es Singular Wealth Management Panamá y no el Singular Bank español

ATENCION: Verificar identidad: ¿Singular Wealth Management (Panamá) o Singular Bank (España)?

Fuentes: https://singularwm.com/en/junta-directiva/ | https://thebusinessyear.com/interview/sergi-lucas-panama-2024/ | https://singularwm.com/en/ | https://www.prensa.com/contenido-patrocinado/singular-la-evolucion-de-una-casa-de-valores-boutique/', 'Angulo de entrada: Escalar sin sumar gente: analizar y proponer sobre las carteras que van absorbiendo, con reporte de performance por estrategia.

Objetivo de la reunion: Presentar MaximUs — análisis de carteras integradas y reporting discrecional

A quien contactar:
- Sergi Lucas Fernández (CEO): El interlocutor. Banquero y asesor patrimonial con más de 20 años en clientes de alto patrimonio. Además preside CAPAMEC, la cámara panameña de mercado de capitales: si compra, es prescriptor de toda la plaza.
- Roberto Brenes P. (Presidente): Banca comercial, finanzas corporativas y desarrollo de mercados de capitales. Perfil institucional, para una segunda instancia.', 'a_contactar'),
  ('pr_830d1228c8', 'Geneva Asset Management (GenAsset)', 'Joaquín De La Guardia - Secretario y socio fundador', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Casa de valores y administrador de inversiones | Grupo Aliado (mismo grupo que Banco Aliado) | Más de USD 2.000 millones

Fundada en 1999 por un grupo de profesionales panameños que venían de Merrill Lynch; Grupo Aliado entró aportando capital y experiencia. Más de 25 años y una de las firmas líderes en gestión patrimonial del país, con enfoque conservador y visión de largo plazo. Administra más de USD 2.000 millones de activos de clientes. Ofrece cuentas de inversión locales e internacionales, asesoría financiera a medida, soluciones de tesorería para institucionales y administra fondos de inversión locales.

Compatibilidad con MaximUs: Muy alta (5/5)

A favor:
- Más de USD 2.000 M: la cuenta más grande de todo el listado frío
- Administra fondos propios: los comparativos de MaximUs sirven para defenderlos y para el análisis competitivo
- Asesoría a medida + tesorería institucional: dos frentes distintos para vender
- Es el brazo de valores de Banco Aliado, que también está en la lista: una sola visita cubre las dos fichas

En contra / a validar:
- No publican el equipo comercial: hay que entrar por los socios fundadores o por Banco Aliado
- Firma grande y conservadora: proceso de decisión más largo que una boutique

Fuentes: https://www.genasset.com/directiva-y-fundadores | https://www.genasset.com/ | https://genasset.com/nuestra-historia/ | https://www.bancoaliado.com/casa-de-valores', 'Angulo de entrada: Entrar por Banco Aliado o por referido: son el mismo grupo. Pitch de asesoría patrimonial industrializada y comparativos contra sus propios fondos.

Objetivo de la reunion: Conseguir reunión — es la cuenta más grande del listado frío

A quien contactar:
- Joaquín De La Guardia (Secretario y socio fundador): Socio fundador, de los que venían de Merrill Lynch. Es el perfil de negocio más accesible de la junta.
- Javier Martínez-Acha (Socio fundador): El otro socio fundador. Alternativa de entrada.
- Joseph Hamoui (Vicepresidente de GenAsset y VP Ejecutivo/CFO de Banco Aliado): Es el puente entre las dos fichas: se sienta en los dos lados del grupo. Si entramos por Banco Aliado, este es el nombre.
- Moisés Chreim (Presidente): Presidente de GenAsset y de Grupo Aliado/Banco Aliado. Es el dueño: reservarlo para cerrar, no para abrir.
- Fernando Lewis (Tesorero)', 'a_contactar'),
  ('pr_4ec41113be', 'Alpha Securities', 'Juan Manuel Barranco - Director (17+ años en dirección estratégica y banca de inversión)', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Casa de valores y administrador de inversiones | Independiente

Firma de intermediación y asesoría financiera constituida en 2011 y regulada por la SMV desde 2013, con doble licencia de casa de valores y administrador de inversiones. Hace gestión de carteras y asesoría financiera personalizada. El equipo directivo viene de mercados de capitales internacionales.

Compatibilidad con MaximUs: Alta (4/5)

A favor:
- Doble licencia (casa de valores + administrador): pueden gestionar carteras discrecionales
- Boutique con directivos de mercados internacionales: entienden el producto sin explicación larga
- Ya tenemos el contacto cargado y es director, no un mando medio
- Sin tecnología propia: espacio limpio para MaximUs

En contra / a validar:
- Tamaño chico, ticket acotado
- No publican AUM: hay que calificar el tamaño real en la reunión

Fuentes: https://alpha.com.pa/nosotros/ | https://supervalores.gob.pa/informacion-de-personas-juridicas-o-entes-regulados/informacion-general-casas-de-valores/', 'Angulo de entrada: Propuesta institucional en minutos y reporting de carteras administradas, con la calidad visual que sus clientes internacionales esperan.

Objetivo de la reunion: Presentar MaximUs — propuestas y gestión de carteras', 'a_contactar'),
  ('pr_287a9c7bb8', 'BP Securities', 'Daniel Sierra', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Broker dealer / casa de valores independiente | Independiente

Broker dealer de alcance global especializado en soluciones financieras integradas. El equipo da asesoría y gestión de activos a clientes finales en toda la región. Trabaja bonos corporativos y soberanos (emergentes, EE.UU. y Europa), acceso directo a las principales familias de fondos mutuos, renta fija, acciones y opciones, alternativos y mercados locales. Ofrece pantallas en vivo y research de renta fija de terceros.

Compatibilidad con MaximUs: Alta (4/5)

A favor:
- Asesoran y gestionan para clientes finales en toda la región: usuario natural de MaximUs
- Fuerte en renta fija y fondos mutuos, que es donde MaximUs tiene el universo cargado
- Reconocen que su research es de terceros: hay lugar para nuestro contenido y nuestras propuestas
- Contacto ya cargado

En contra / a validar:
- Perfil bastante transaccional: hay que empujar hacia asesoría con propuesta y reporte
- Sin datos públicos de tamaño

Fuentes: https://www.securitiesbp.com/', 'Angulo de entrada: Propuesta de renta fija con la ficha de cada bono y el reporte al cliente. Es su producto core y hoy lo arman a mano.

Objetivo de la reunion: Presentar MaximUs — propuestas de renta fija y fondos', 'a_contactar'),
  ('pr_7550a8906b', 'LAFISE Valores de Panamá', 'Christian Cedeño', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Casa de valores y administrador de inversiones | Grupo LAFISE: 12 países, +8.000 empleados, +200 oficinas, desde 1985

Brazo de valores del Grupo LAFISE en Panamá, con más de 20 años de licencia. Da asesoría bursátil, administración de portafolios y custodia. En banca privada ofrece LAFISE Portafolio, un producto de gestión personalizada, además de préstamos con garantía de títulos valores.

Compatibilidad con MaximUs: Alta (4/5)

A favor:
- Tienen un producto de portafolio administrado (LAFISE Portafolio): necesitan proponerlo y reportarlo
- Grupo regional en 12 países: una implementación en Panamá abre la puerta a Centroamérica
- Contacto cargado
- Estructura de banca privada consolidada, no un proyecto incipiente

En contra / a validar:
- Es un grupo grande: la decisión puede escalar a la casa matriz en Nicaragua/Costa Rica
- Parte de su foco es mercado local, donde MaximUs aporta menos

Fuentes: https://www.lafise.com/blp/banca-privada/soluciones-internacionales/valores/ | https://www.lafise.com/blp/banca-privada/inversiones-personalizadas/lafise-portafolio/ | https://supervalores.gob.pa/wp-content/uploads/2021/03/Lafise.pdf', 'Angulo de entrada: LAFISE Portafolio: propuesta, análisis y reporte mensual al cliente. Y el argumento regional para escalar al grupo.

Objetivo de la reunion: Presentar MaximUs — soporte a LAFISE Portafolio y banca privada', 'a_contactar'),
  ('pr_7653b7dc0e', 'MetroBank', 'Emanuel Bosquez - Gerente de Banca Privada e Inversiones', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Banco de licencia general con banca privada | MetroBank / Metro Asset Management

Banco fundado en 1991 con plataforma completa de banca privada, corporativa y de consumo. En inversiones ofrece asesoría, cuentas de inversión administradas, cuenta local (bolsa panameña) y cuenta internacional, el Metro Strategic Income Fund y financiamiento con garantía de portafolio. A través de Metro Asset Management administra fondos mutuos. Oficinas en Punta Pacífica, con sucursales en la ciudad, Zona Libre de Colón y Chiriquí.

Compatibilidad con MaximUs: Alta (4/5)

A favor:
- Tienen cuentas administradas y fondos propios: necesitan proponer y reportar, que es el core de MaximUs
- Metro Asset Management da un segundo interlocutor dentro de la misma casa
- Banco mediano: más ágil que Banco General o Banistmo para decidir
- Financian contra portafolio: necesitan ver y valuar la cartera del cliente

En contra / a validar:
- Al ser banco, puede haber área de tecnología con su propio calendario
- Es un gerente, no un vicepresidente: puede necesitar subir la decisión

Fuentes: https://www.metrobanksa.com/asesores/ | https://www.metrobanksa.com/banca-privada-metrobank/ | https://www.metrobanksa.com/metro-asset-management/ | https://supervalores.gob.pa/metrobank-s-a/', 'Angulo de entrada: Cuentas administradas y Metro Strategic Income Fund: propuesta al cliente, comparativo contra alternativas y reporte periódico.

Objetivo de la reunion: Conseguir reunión con banca privada / Metro Asset Management

A quien contactar:
- Emanuel Bosquez (Gerente de Banca Privada e Inversiones): Es exactamente el cargo que buscamos y el mejor contacto de todo el listado frío. Más de 20 años en el mercado financiero panameño y es quien constituyó el Metro Strategic Income Fund. Figura en el sitio del banco.', 'a_contactar'),
  ('pr_5a166d9dfe', 'Mercantil Servicios de Inversión', 'Lucianio Scandolari - Gerente general', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Casa de valores y administrador de inversiones | Grupo Mercantil (Panamá, Venezuela y Suiza)

Casa de valores y administrador de inversiones del Grupo Mercantil, conglomerado financiero con banca, seguros, reaseguros, gestión patrimonial y fintech en Panamá, Venezuela y Suiza. Ofrece inversión en línea, cuentas institucionales, fondos mutuos, cuentas de margen y notas estructuradas, con custodia y acceso a mercados globales.

Compatibilidad con MaximUs: Alta (4/5)

A favor:
- Venden notas estructuradas: el analizador de notas es una puerta de entrada distinta y muy concreta
- Son custodio local de otras casas de valores: pueden funcionar como canal hacia los asesores que custodian ahí
- Grupo con presencia en Suiza: estándar de reporting alto
- Amplio catálogo (fondos, margen, estructurados) que hay que explicar y proponer al cliente

En contra / a validar:
- El ''Alex C.'' de la plataforma no se pudo identificar: preguntar internamente quién es
- Grupo grande y con áreas propias: puede haber sistemas heredados

Fuentes: https://www.mercantilsi.com.pa/ | https://www.mercantilsi.com.pa/institucional/historia.html', 'Angulo de entrada: Doble: análisis de notas estructuradas para el equipo comercial, y propuesta/reporte para las casas que custodian con ellos.

Objetivo de la reunion: Presentar MaximUs — notas estructuradas y rol de custodio/canal

A quien contactar:
- Lucianio Scandolari (Gerente general): Figura como gerente actual en el registro de la SMV.
- Samuel Ignacio Briceño Méndez (Representante legal)
- ''Alex C.'' (—): Es el contacto que estaba cargado en la plataforma, sin apellido. No se pudo identificar: preguntar internamente quién es antes de descartarlo, puede ser el asesor que ya nos conoce.', 'a_contactar'),
  ('pr_c0698a3179', 'Carlton Securities', 'Jorge Eduardo Vélez - Representante legal', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Casa de valores | Independiente

Casa de valores supervisada por la SMV que hace intermediación con todos los instrumentos habilitados, ruteando las operaciones a brokers norteamericanos y globales. Ofrece además forwards y contratos de futuros. Se presenta por agilidad, eficiencia y flexibilidad, diseñando soluciones a medida de cada cliente.

Compatibilidad con MaximUs: Media (3/5)

A favor:
- Chica y ágil: decisión en una o dos reuniones
- Contacto cargado y es el representante legal
- Si hoy son sobre todo ejecución, MaximUs les agrega la capa de asesoría que no tienen y les permite subir el ticket

En contra / a validar:
- Perfil aparentemente más transaccional (forwards y futuros) que de gestión de carteras
- No se ve un negocio de asesoría patrimonial declarado: hay que calificarlo en la reunión
- Sin datos de tamaño

Fuentes: https://www.carltonvalores.com/inicio/quienes-somos | http://apamec.org/miembros/', 'Angulo de entrada: Pasar de ejecutar a asesorar: propuesta y reporte al cliente como diferencial competitivo.

Objetivo de la reunion: Calificar: ¿asesoran carteras o solo ejecutan?', 'a_contactar'),
  ('pr_6d8015e5f1', 'Towerbank International', 'Yurgen Espinosa - Manager, Treasury and Investments', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Banco local con casa de valores subsidiaria | Grupo Towerbank: Tower Securities (1990), Towertrust (1995), Tower Leasing (2010)

Banco fundado en 1971, más de 50 años en banca corporativa y personal en Panamá y Latinoamérica. Su subsidiaria Tower Securities opera desde 1990 con puesto propio en la Bolsa de Valores de Panamá y maneja operaciones propias y de clientes. Ofrece wealth management con renta fija, acciones, bonos y fondos mutuos. Utilidad neta +18,8% en el primer trimestre de 2026.

Compatibilidad con MaximUs: Media (3/5)

A favor:
- Tower Securities es el interlocutor concreto y lleva 35 años operando
- Wealth management con fondos y renta fija: hay carteras que proponer y reportar
- Banco en crecimiento (utilidad +18,8% en 1T-2026): hay presupuesto

En contra / a validar:
- La parte fuerte del banco es corporativa; el negocio de inversión puede ser accesorio
- Estructura bancaria: ciclo de decisión más lento
- Tower Securities no publica ejecutivos propios: se entra por tesorería e inversiones del banco

Fuentes: https://www.towerbank.com/en/corporate-information | https://supervalores.gob.pa/wp-content/uploads/2021/03/Towerbank-International-2016.pdf', 'Angulo de entrada: Entrar por Tower Securities, no por el banco. Propuesta y reporte para los clientes de wealth management.

Objetivo de la reunion: Conseguir reunión con Tower Securities / wealth management

A quien contactar:
- Yurgen Espinosa (Manager, Treasury and Investments): El que maneja inversiones. Primera puerta.
- Adriana Peña (Assistant Vice President, Private Banking): El lado de clientes: es quien sufre la propuesta y el reporte al cliente.
- Sagel de Reyes Tabernacle (Manager, Private Banking)
- Mónica Vial (Gerente general (desde el 5/1/2026)): 35 años en el banco, venía de VP Senior de Banca Corporativa. Asumió hace poco: momento típico de revisión de proveedores.', 'a_contactar'),
  ('pr_c1252e466b', 'Firmus Financial', 'Yariela Samaniego - Oficial de cumplimiento y ejecutivo principal licenciado por la SMV', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Casa de valores | Firmus Group

Casa de valores licenciada en 2014, con oficinas en Costa del Este. Bajo la marca Firmus Broker & Asset Management ofrece inversión online y trading automatizado en mercados internacionales, análisis, gestión y custodia de activos financieros internacionales, y diversificación de portafolios combinando inversiones y divisas.

Compatibilidad con MaximUs: Media (3/5)

A favor:
- 11-50 empleados: tamaño suficiente para tener varios asesores usando la herramienta
- Hacen gestión y diversificación de portafolios internacionales
- Ya trabajan con tecnología: no hay que evangelizar sobre software

En contra / a validar:
- El foco es trading online y automatizado, más ejecución que asesoría patrimonial
- El contacto cargado es de cumplimiento, no comercial: hay que pedir que nos derive al área de inversiones
- Yariela Samaniego también aparece asociada a Winexco Securities: confirmar dónde está hoy antes de escribirle

ATENCION: El contacto figura también en Winexco Securities — confirmar antes de escribir

Fuentes: https://www.firmus-financial.com/our-team.html | http://www.firmusbroker.com/', 'Angulo de entrada: Si el negocio es trading, ir por el lado de diversificación de portafolios: propuesta y reporte para los clientes que sí quieren asesoría.

Objetivo de la reunion: Calificar el negocio y pedir derivación al área comercial', 'a_contactar'),
  ('pr_85c6e95551', 'Creand Securities Panamá', 'David Rabella', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Casa de valores + banca privada | Crèdit Andorrà Financial Group / Creand (fundado en 1950, 75 años) | n/d en Panamá

Casa de valores constituida en Panamá en 2009, dedicada a la gestión patrimonial de clientes privados de todo el mundo, con el respaldo del grupo andorrano Crèdit Andorrà. Junto con Creand Wealth Management operan la plataforma de banca y valores regulada del grupo para clientes de América, con servicio de banca privada de arquitectura abierta.

Compatibilidad con MaximUs: Media (3/5)

A favor:
- Arquitectura abierta declarada: los comparativos de fondos y ETFs les sirven
- Banca privada pura, sin ruido de banca comercial
- Clientes internacionales que exigen documentación prolija

En contra / a validar:
- Las decisiones de sistemas se toman en Andorra, no en Panamá
- Ya tienen research y plataforma del grupo: el hueco es más chico
- Riesgo de que la reunión quede en cortesía

Fuentes: https://creandsecurities.pa/en/about-us/ | https://creand.pa/en/', 'Angulo de entrada: Material y propuestas en español rioplatense/latino para los asesores locales, y comparativos independientes que el grupo no les da.

Objetivo de la reunion: Explorar si deciden localmente o dependen de Andorra', 'a_contactar'),
  ('pr_e5ba89d491', 'Banco Aliado', 'Sandra Olaciregui - Vicepresidente Senior de Banca Privada', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Banco de licencia general | Grupo Aliado — tercer banco de capital panameño; dueño también de Geneva Asset Management | El negocio de valores está en Geneva (+USD 2.000 M)

Banco de licencia general fundado en 1992, parte de Grupo Aliado, tercer banco de capital panameño del país. Su fuerte es el segmento corporativo selectivo, con depósitos, crédito, leasing, factoring y banca de inversión. El negocio de valores no lo hace el banco: lo canaliza a través de su afiliada Geneva Asset Management, que ofrece bonos, acciones, fondos e instrumentos de mercados internacionales.

Compatibilidad con MaximUs: Baja (2/5)

A favor:
- Es la puerta de entrada natural a Geneva Asset Management, que sí es cuenta grande
- Banca privada propia además del canal de Geneva
- Grupo con capital panameño y decisión local

En contra / a validar:
- El banco en sí es corporativo: no es usuario de una herramienta de propuestas de inversión
- El interlocutor de inversiones real está en Geneva, no acá
- El ''Mathi'' que estaba cargado no se pudo identificar en la alta gerencia

ATENCION: Mismo grupo que Geneva Asset Management — coordinar una sola visita

Fuentes: https://bancoaliado.com/gobierno-corporativo/alta-gerencia | https://www.bancoaliado.com/casa-de-valores | https://bancoaliado.com/banca-privada | https://supervalores.gob.pa/banco-aliado-s-a/', 'Angulo de entrada: No tratarlo como cuenta separada: usarlo como vía de acceso a Geneva. Una sola visita para las dos fichas.

Objetivo de la reunion: Usar como puerta de entrada a Geneva Asset Management

A quien contactar:
- Sandra Olaciregui (VP Senior de Banca Privada): Reemplaza al ''Mathi'' que estaba cargado sin apellido. Es el único cargo del banco que toca inversiones de clientes.
- Joseph Chreim (VP Senior de Desarrollo de Negocio y Datos): Apellido de la familia dueña del grupo y el cargo justo para una herramienta nueva: es el que evalúa este tipo de proyecto.
- Joseph Hamoui (VP Ejecutivo y CFO de Banco Aliado; vicepresidente de GenAsset): El puente formal hacia Geneva.
- Gustavo Eisenmann (Presidente)', 'a_contactar'),
  ('pr_fa2a798e43', 'Banco General (BG Valores)', 'Michelle Núñez Olivares - Vicepresidente Ejecutiva y Gerente General de BG Valores', 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Banco más grande de Panamá + casa de valores propia | Grupo Financiero BG, listado en Latinex

BG Valores nació en 1987 como boutique de asesoría y gestión patrimonial con el nombre Wall Street Securities; Banco Continental la compró en 2004 por USD 56 millones para convertirla en su departamento de banca privada, y tras la fusión pasó a ser subsidiaria 100% de Banco General en 2007, renombrada BG Valores en 2010. Domina el mercado local: llegó a operar el 90% del secundario de acciones locales y el 47% del volumen de cuotas de fondos en la Bolsa de Valores de Panamá.

Compatibilidad con MaximUs: Baja (2/5)

A favor:
- Si entra, es la cuenta más grande del mercado
- Banca privada consolidada con volumen real

En contra / a validar:
- Institución grande con sistemas propios y compras por proceso formal: no se cierra en una visita
- Su fuerte es el mercado local panameño, donde MaximUs aporta menos que en carteras internacionales
- Sin referido, llegar a la gerencia general de BG Valores en frío es difícil

Fuentes: https://www.bgeneral.com/personas/bg-valores/ | https://supervalores.gob.pa/banco-general-sa-casa-de-valores-de-banco-general-sa-banco-general-banca-privada/', 'Angulo de entrada: Visita de posicionamiento, no de cierre. Objetivo realista: entender quién decide en banca privada y dejar sembrado.

Objetivo de la reunion: Posicionamiento y mapeo de decisores

A quien contactar:
- Michelle Núñez Olivares (VP Ejecutiva y Gerente General de BG Valores): Es la que manda en la casa de valores. Toda la conversación pasa por acá, no por el banco.
- Francisco Ernesto Sierra Fábrega (VP Ejecutivo y Subgerente General de Banco General; preside la junta directiva de BG Valores): Nivel de escalamiento, no de primera reunión.', 'a_contactar'),
  ('pr_b797a5c061', 'Fince', NULL, 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

No identificado | n/d

No se encontró ninguna entidad llamada Fince en el registro de casas de valores de la Superintendencia del Mercado de Valores de Panamá ni en fuentes públicas. Las coincidencias más cercanas son Finec Asset Management Corp (Panamá) y LVM Casa de Valores. Puede ser un nombre mal cargado, una firma no regulada como casa de valores, o una referencia interna.

Compatibilidad con MaximUs: Sin calificar (1/5)

A favor:
- Si es Finec Asset Management, entra en el perfil de boutique de gestión y valdría la pena

En contra / a validar:
- No se pudo verificar la existencia de la firma
- Sin contacto, sin sitio, sin licencia identificada
- Agendar a ciegas es quemar un slot de agenda

ATENCION: No identificada en el registro de la SMV — confirmar el nombre antes de agendar

Fuentes: https://supervalores.gob.pa/informacion-de-personas-juridicas-o-entes-regulados/informacion-general-casas-de-valores/', 'Angulo de entrada: No agendar hasta confirmar de quién se trata. Preguntar internamente quién cargó la ficha.

Objetivo de la reunion: Verificar identidad antes de agendar', 'a_contactar'),
  ('pr_e068559756', 'SeaGate Capital', NULL, 'MaximUs Pro', 'Panama', '[Research Panama - julio 2026]

Casa de valores LIQUIDADA | — | —

SeaGate Capital Corp fue sancionada por la SMV con una multa de USD 1 millón tras varios años de investigación, por deficiencias de control en cuentas de inversión, en políticas, en la aprobación de márgenes de clientes y en el manejo de cuentas propias y de clientes. La SMV ordenó su liquidación forzosa administrativa mediante la resolución SMV-7-19 del 14 de enero de 2019. Hoy figura en los registros como casa de valores liquidada.

Compatibilidad con MaximUs: Descartar (0/5)

En contra / a validar:
- La entidad no existe: liquidación forzosa ordenada por la SMV en enero de 2019
- Antecedente regulatorio grave: multa de USD 1 millón por manejo de cuentas de clientes
- Ni siquiera corresponde intentar el contacto

ATENCION: LIQUIDADA por la SMV en 2019 (Res. SMV-7-19) — sacar de la base

Fuentes: https://supervalores.gob.pa/comunicado-publico-liquidacion-forzosa-administrativa-de-seagate-capital-corp/ | https://www.estrategiaynegocios.net/finanzas/1505512-330/panamá-smv-multa-con-us1-millón-a-la-casa-de-valores-seagate', 'Angulo de entrada: Eliminar de la base de prospectos.

Objetivo de la reunion: No visitar — dar de baja en la plataforma', 'a_contactar')
on conflict (id) do update set
  contacto  = excluded.contacto,
  notas     = excluded.notas,
  nota_plan = excluded.nota_plan;

-- SweetWater Securities: YA EXISTE en la base como 'Sweetwater' (id agluxhdakz95).
-- Se actualiza el registro existente en vez de crear uno nuevo, para no duplicar.
update public.maximus_clients set
  contacto  = 'Daniela',
  pais      = 'Panama',
  accion    = 'Visita de relacionamiento y pedir referidos a Geneva y LAFISE',
  nota_plan = 'Casa de valores independiente con puesto en la BVP, miembro de Latinclear y custodia internacional en BNY Pershing. Servicios: manejo de inversiones, multi family office, finanzas corporativas y un fondo de renta fija. Socios: Rodrigo Tapia Cardoze (managing partner, VP Wealth Management, CIMA), Fernando Tapia Cardoze (managing partner y ejecutivo principal, maneja la plataforma de Pershing; antes en LAFISE Valores y Geneva Asset Management) y Rogelio Rengifo H. (managing partner; fue VP Senior de Geneva Asset Management durante una década, y antes Banco Nacional de Panamá y Citi). Dos de los tres socios vienen de Geneva y uno de LAFISE: es el mejor puente de referidos hacia esas dos cuentas frías.'
where id = 'agluxhdakz95';

-- Opcionales, descomentar si estas de acuerdo:
-- SeaGate Capital esta en liquidacion forzosa desde 2019 (Res. SMV-7-19)
-- update public.maximus_prospects set estado = 'no_les_interesa' where id = 'pr_e068559756';
-- Fince no aparece en el registro de la SMV: verificar antes de trabajarlo
-- update public.maximus_prospects set estado = 'no_les_interesa' where id = 'pr_b797a5c061';