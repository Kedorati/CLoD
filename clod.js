/**
 * The CLoD game system for Foundry Virtual Tabletop
 * A system for playing the Cearbhall: Legends Of Dastards roleplaying game.
 * Author: Kedorati
 * Software License: GNU GPLv3
 * Repository: https://github.com/kedorati/CLoD
 */

// Import Modules
import { CLOD } from "./module/config.js";
import { registerSystemSettings } from "./module/settings.js";
import { preloadHandlebarsTemplates } from "./module/templates.js";
import { _getInitiativeFormula } from "./module/combat.js";
import { measureDistances } from "./module/canvas.js";

// Import Documents
import ActorCLoD from "./module/actor/entity.js";
import ItemCLoD from "./module/item/entity.js";
import { TokenDocumentCLoD, TokenCLoD } from "./module/token.js";

// Import Applications
import AbilityTemplate from "./module/pixi/ability-template.js";
import AbilityUseDialog from "./module/apps/ability-use-dialog.js";
import ActorSheetFlags from "./module/apps/actor-flags.js";
import ActorSheetCLoDCharacter from "./module/actor/sheets/character.js";
import ActorSheetCLoDNPC from "./module/actor/sheets/npc.js";
import ActorSheetCLoDVehicle from "./module/actor/sheets/vehicle.js";
import ItemSheetCLoD from "./module/item/sheet.js";
import ShortRestDialog from "./module/apps/short-rest.js";
import TraitSelector from "./module/apps/trait-selector.js";
import ActorMovementConfig from "./module/apps/movement-config.js";
import ActorSensesConfig from "./module/apps/senses-config.js";

// Import Helpers
import * as chat from "./module/chat.js";
import * as dice from "./module/dice.js";
import * as macros from "./module/macros.js";
import * as migrations from "./module/migration.js";
import ActiveEffectCLoD from "./module/active-effect.js";
import ActorAbilityConfig from "./module/apps/ability-config.js";
import ActorSkillConfig from "./module/apps/skill-config.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", function() {
  console.log(`CLoD | Initializing the CLoD Game System\n${CLOD.ASCII}`);

  // Create a namespace within the game global
  game.CLoD = {
    applications: {
      AbilityUseDialog,
      ActorSheetFlags,
      ActorSheetCLoDCharacter,
      ActorSheetCLoDNPC,
      ActorSheetCLoDVehicle,
      ItemSheetCLoD,
      ShortRestDialog,
      TraitSelector,
      ActorMovementConfig,
      ActorSensesConfig,
      ActorAbilityConfig,
      ActorSkillConfig
    },
    canvas: {
      AbilityTemplate
    },
    config: CLOD,
    dice: dice,
    entities: {
      ActorCLoD,
      ItemCLoD,
      TokenDocumentCLoD,
      TokenCLoD
    },
    macros: macros,
    migrations: migrations,
    rollItemMacro: macros.rollItemMacro,
    isV9: !foundry.utils.isNewerVersion("9.224", game.version ?? game.data.version)
  };

  // This will be removed when CLoD minimum core version is updated to v9.
  if ( !game.CLoD.isV9 ) dice.shimIsDeterministic();

  // Record Configuration Values
  CONFIG.CLOD = CLOD;
  CONFIG.ActiveEffect.documentClass = ActiveEffectCLoD;
  CONFIG.Actor.documentClass = ActorCLoD;
  CONFIG.Item.documentClass = ItemCLoD;
  CONFIG.Token.documentClass = TokenDocumentCLoD;
  CONFIG.Token.objectClass = TokenCLoD;
  CONFIG.time.roundTime = 6;

  CONFIG.Dice.DamageRoll = dice.DamageRoll;
  CONFIG.Dice.D20Roll = dice.D20Roll;

  // CLoD cone RAW should be 53.13 degrees
  CONFIG.MeasuredTemplate.defaults.angle = 53.13;

  // Register System Settings
  registerSystemSettings();

  // Patch Core Functions
  CONFIG.Combat.initiative.formula = "1d20 + @attributes.init.mod + @attributes.init.prof + @attributes.init.bonus + @abilities.dex.bonuses.check + @bonuses.abilities.check";
  Combatant.prototype._getInitiativeFormula = _getInitiativeFormula;

  // Register Roll Extensions
  CONFIG.Dice.rolls.push(dice.D20Roll);
  CONFIG.Dice.rolls.push(dice.DamageRoll);

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("CLoD", ActorSheetCLoDCharacter, {
    types: ["character"],
    makeDefault: true,
    label: "CLOD.SheetClassCharacter"
  });
  Actors.registerSheet("CLoD", ActorSheetCLoDNPC, {
    types: ["npc"],
    makeDefault: true,
    label: "CLOD.SheetClassNPC"
  });
  Actors.registerSheet("CLoD", ActorSheetCLoDVehicle, {
    types: ["vehicle"],
    makeDefault: true,
    label: "CLOD.SheetClassVehicle"
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("CLoD", ItemSheetCLoD, {
    makeDefault: true,
    label: "CLOD.SheetClassItem"
  });

  // Preload Handlebars Templates
  return preloadHandlebarsTemplates();
});


/* -------------------------------------------- */
/*  Foundry VTT Setup                           */
/* -------------------------------------------- */

/**
 * Perform one-time pre-localization and sorting of some configuration objects
 */
Hooks.once("setup", function() {
  const localizeKeys = [
    "abilities", "abilityAbbreviations", "abilityActivationTypes", "abilityConsumptionTypes", "actorSizes",
    "alignments", "armorClasses.label", "armorProficiencies", "armorTypes", "conditionTypes", "consumableTypes",
    "cover", "currencies.label", "currencies.abbreviation", "damageResistanceTypes", "damageTypes", "distanceUnits",
    "equipmentTypes", "healingTypes", "itemActionTypes", "itemRarity", "languages", "limitedUsePeriods",
    "miscEquipmentTypes", "movementTypes", "movementUnits", "polymorphSettings", "proficiencyLevels", "senses",
    "skills", "spellComponents", "spellLevels", "spellPreparationModes", "spellScalingModes", "spellSchools",
    "targetTypes", "timePeriods", "toolProficiencies", "toolTypes", "vehicleTypes", "weaponProficiencies",
    "weaponProperties", "weaponTypes"
  ];
  const sortKeys = [
    "abilityAbbreviations", "abilityActivationTypes", "abilityConsumptionTypes", "actorSizes", "conditionTypes",
    "consumableTypes", "cover", "damageResistanceTypes", "damageTypes", "equipmentTypes", "healingTypes",
    "languages", "miscEquipmentTypes", "movementTypes", "polymorphSettings", "senses", "skills", "spellScalingModes",
    "spellSchools", "targetTypes", "toolProficiencies", "toolTypes", "vehicleTypes", "weaponProperties"
  ];
  preLocalizeConfig(CONFIG.CLOD, localizeKeys, sortKeys);
  CONFIG.CLOD.trackableAttributes = expandAttributeList(CONFIG.CLOD.trackableAttributes);
  CONFIG.CLOD.consumableResources = expandAttributeList(CONFIG.CLOD.consumableResources);
});

/* -------------------------------------------- */

/**
 * Localize and sort configuration values
 * @param {object} config           The configuration object being prepared
 * @param {string[]} localizeKeys   An array of keys to localize
 * @param {string[]} sortKeys       An array of keys to sort
 */
function preLocalizeConfig(config, localizeKeys, sortKeys) {

  // Localize Objects
  for ( const key of localizeKeys ) {
    if ( key.includes(".") ) {
      const [inner, label] = key.split(".");
      _localizeObject(config[inner], label);
    }
    else _localizeObject(config[key]);
  }

  // Sort objects
  for ( const key of sortKeys ) {
    if ( key.includes(".") ) {
      const [configKey, sortKey] = key.split(".");
      config[configKey] = _sortObject(config[configKey], sortKey);
    }
    else config[key] = _sortObject(config[key]);
  }
}

/* -------------------------------------------- */

/**
 * Localize the values of a configuration object by translating them in-place.
 * @param {object} obj                The configuration object to localize
 * @param {string} [key]              An inner key which should be localized
 * @private
 */
function _localizeObject(obj, key) {
  for ( const [k, v] of Object.entries(obj) ) {

    // String directly
    if ( typeof v === "string" ) {
      obj[k] = game.i18n.localize(v);
      continue;
    }

    // Inner object
    if ( (typeof v !== "object") || !(key in v) ) {
      console.error(new Error("Configuration values must be a string or inner object for pre-localization"));
      continue;
    }
    v[key] = game.i18n.localize(v[key]);
  }
}

/* -------------------------------------------- */

/**
 * Sort a configuration object by its values or by an inner sortKey.
 * @param {object} obj                The configuration object to sort
 * @param {string} [sortKey]          An inner key upon which to sort
 * @returns {{[p: string]: any}}      The sorted configuration object
 */
function _sortObject(obj, sortKey) {
  let sorted = Object.entries(obj);
  if ( sortKey ) sorted = sorted.sort((a, b) => a[1][sortKey].localeCompare(b[1][sortKey]));
  else sorted = sorted.sort((a, b) => a[1].localeCompare(b[1]));
  return Object.fromEntries(sorted);
}

/* --------------------------------------------- */

/**
 * Expand a list of attribute paths into an object that can be traversed.
 * @param {string[]} attributes  The initial attributes configuration.
 * @returns {object}  The expanded object structure.
 */
function expandAttributeList(attributes) {
  return attributes.reduce((obj, attr) => {
    foundry.utils.setProperty(obj, attr, true);
    return obj;
  }, {});
}

/* -------------------------------------------- */
/*  Foundry VTT Ready                           */
/* -------------------------------------------- */

/**
 * Once the entire VTT framework is initialized, check to see if we should perform a data migration
 */
Hooks.once("ready", function() {

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => macros.createCLoDMacro(data, slot));

  // Determine whether a system migration is required and feasible
  if ( !game.user.isGM ) return;
  const currentVersion = game.settings.get("CLoD", "systemMigrationVersion");
  const NEEDS_MIGRATION_VERSION = "1.5.6";
  const COMPATIBLE_MIGRATION_VERSION = 0.80;
  const totalDocuments = game.actors.size + game.scenes.size + game.items.size;
  if ( !currentVersion && totalDocuments === 0 ) return game.settings.set("CLoD", "systemMigrationVersion", game.system.data.version);
  const needsMigration = !currentVersion || isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion);
  if ( !needsMigration ) return;

  // Perform the migration
  if ( currentVersion && isNewerVersion(COMPATIBLE_MIGRATION_VERSION, currentVersion) ) {
    const warning = "Your CLoD system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.";
    ui.notifications.error(warning, {permanent: true});
  }
  migrations.migrateWorld();
});

/* -------------------------------------------- */
/*  Canvas Initialization                       */
/* -------------------------------------------- */

Hooks.on("canvasInit", function() {
  // Extend Diagonal Measurement
  canvas.grid.diagonalRule = game.settings.get("CLoD", "diagonalMovement");
  SquareGrid.prototype.measureDistances = measureDistances;
});


/* -------------------------------------------- */
/*  Other Hooks                                 */
/* -------------------------------------------- */

Hooks.on("renderChatMessage", (app, html, data) => {

  // Display action buttons
  chat.displayChatActionButtons(app, html, data);

  // Highlight critical success or failure die
  chat.highlightCriticalSuccessFailure(app, html, data);

  // Optionally collapse the content
  if (game.settings.get("CLoD", "autoCollapseItemCards")) html.find(".card-content").hide();
});
Hooks.on("getChatLogEntryContext", chat.addChatMessageContextOptions);
Hooks.on("renderChatLog", (app, html, data) => ItemCLoD.chatListeners(html));
Hooks.on("renderChatPopout", (app, html, data) => ItemCLoD.chatListeners(html));
Hooks.on("getActorDirectoryEntryContext", ActorCLoD.addDirectoryContextOptions);

// FIXME: This helper is needed for the vehicle sheet. It should probably be refactored.
Handlebars.registerHelper("getProperty", function(data, property) {
  return getProperty(data, property);
});
