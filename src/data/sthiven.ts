import type { Character } from '../types/character'

export const sthiven: Character = {
  name: 'Sthiven',
  class: 'Clérigo',
  level: 8,
  background: '',
  playerName: 'Sthiven',
  race: 'Humano',
  alignment: 'Sabedoria',
  experiencePoints: 0,

  abilities: {
    for: { score: 13 },
    des: { score: 10 },
    con: { score: 15 },
    int: { score: 14 },
    sab: { score: 17 },
    car: { score: 13 },
  },
  inspiration: 3,
  proficiencyBonus: 3,
  savingThrowProficiencies: ['sab', 'car'],
  skillProficiencies: ['arcanismo', 'historia', 'intuicao', 'medicina'],
  skillExpertise: [],

  armorClass: 12,
  initiativeBonus: 0,
  speed: '9m',

  hpMax: 56,
  hpCurrent: 56,
  hpTemp: 0,
  hitDiceTotal: '8',
  hitDiceType: 'd8',
  deathSaves: { successes: 0, failures: 0 },

  attacks: [],
  equipment: [{ name: 'Maça' }, { name: 'Armadura de couro' }],
  currency: { pc: 0, pp: 0, pe: 0, po: 0, pl: 0 },

  otherProficienciesAndLanguages: '',
  featuresAndTraits: '',

  personalityTraits:
    'Sempre carrega pergaminho e carvão para anotar tudo que aprende. Tropeça nas próprias palavras (e nos próprios pés) quando está nervoso, mas nunca hesita em socorrer quem está ferido.',
  ideals:
    'Conhecimento. Todo saber tem valor e deve ser preservado e compartilhado, principalmente se curar ou proteger alguém.',
  bonds:
    'Devo tudo o que sei ao templo/biblioteca onde aprendi a curar. Um dia voltarei para retribuir esse ensinamento.',
  flaws:
    'Distrai-se com teorias e detalhes interessantes, às vezes ignorando perigos óbvios. Desastrado o bastante para derrubar frascos e poções nos piores momentos.',

  spellcasting: {
    class: 'Clérigo',
    ability: 'sab',
    saveDC: 14,
    attackBonus: 6,
    cantrips: [
      {
        name: 'Abençoar',
        prepared: true,
        domain: true,
        description:
          'Concentração, 1 minuto. Até três criaturas à vontade ganham 1d4 extra em testes de ataque e salvaguardas enquanto a concentração durar.',
      },
      {
        name: 'Curar Ferimentos',
        prepared: true,
        domain: true,
        description:
          'Toque. Restaura 1d8 + modificador de Sabedoria em pontos de vida a uma criatura tocada (sem efeito em mortos-vivos e constructos).',
      },
      {
        name: 'Palavra de Cura',
        prepared: true,
        description:
          'Ação bônus, 18m. Restaura 1d4 + modificador de Sabedoria em pontos de vida a uma criatura à distância, sem precisar de toque.',
      },
      {
        name: 'Santuário',
        prepared: true,
        description:
          'Ação bônus. Protege uma criatura: inimigos precisam ser bem-sucedidos num teste de Sabedoria para atacá-la diretamente durante 1 minuto.',
      },
      {
        name: 'Escudo da Fé',
        prepared: true,
        description: 'Ação bônus, concentração até 10 minutos. Concede +2 na CA de uma criatura à vontade.',
      },
    ],
    levels: {
      '1': {
        totalSlots: 3,
        usedSlots: null,
        spells: [
          {
            name: 'Restauração Menor',
            prepared: false,
            domain: true,
            description: 'Toque. Remove uma condição (cego, surdo, paralisado, envenenado) ou uma doença da criatura tocada.',
          },
          {
            name: 'Arma Espiritual',
            prepared: false,
            domain: true,
            description:
              'Ação bônus, dura 1 minuto (sem concentração). Cria uma arma espectral que ataca à distância, causando 1d8 + metade do bônus de proficiência em dano de força.',
          },
          {
            name: 'Oração de Cura',
            prepared: false,
            description: '10 minutos de execução. Restaura 2d8 + modificador de Sabedoria em pontos de vida a até seis criaturas à vontade.',
          },
          {
            name: 'Auxílio',
            prepared: false,
            description: 'Aumenta o máximo e o atual de pontos de vida de até três criaturas em 5 (mais em círculos superiores) por 8 horas.',
          },
          {
            name: 'Vínculo Protetor',
            prepared: false,
            description:
              'Toque, concentração até 1 hora. Une conjurador e alvo: ambos ganham +1 na CA e salvaguardas e resistência a todo dano, e o dano sofrido pelo alvo é repartido com o conjurador.',
          },
        ],
      },
      '2': { totalSlots: null, usedSlots: null, spells: [] },
      '3': {
        totalSlots: 2,
        usedSlots: null,
        spells: [
          {
            name: 'Guardiões Espirituais',
            prepared: false,
            description:
              'Ação, concentração até 10 minutos, raio de 3m ao redor de si. Espíritos protetores causam 3d8 de dano (metade com sucesso) a inimigos que entrem ou comecem o turno na área.',
          },
          {
            name: 'Dissipar Magia',
            prepared: false,
            description: 'Ação, alcance 36m. Encerra um efeito mágico ativo em uma criatura, objeto ou efeito visado.',
          },
        ],
      },
      '4': { totalSlots: null, usedSlots: null, spells: [] },
      '5': { totalSlots: null, usedSlots: null, spells: [] },
      '6': { totalSlots: null, usedSlots: null, spells: [] },
      '7': { totalSlots: null, usedSlots: null, spells: [] },
      '8': { totalSlots: null, usedSlots: null, spells: [] },
      '9': { totalSlots: null, usedSlots: null, spells: [] },
    },
  },

  appearance: {
    age: '',
    height: '',
    weight: '',
    eyes: '',
    skin: '',
    hair: '',
    description: '',
  },
  alliesAndOrganizations: '',
  symbolName: '',
  additionalFeatures: '',
  backstory: '',
  treasure: '',
  cases: [],
}
