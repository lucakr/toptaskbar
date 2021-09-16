/* shortcuts.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const GETTEXT_DOMAIN = 'toptaskbar@lucakr.github.io';

const { Clutter, GObject, St } = imports.gi;

const Gettext = imports.gettext.domain(GETTEXT_DOMAIN);
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const AppFavorites = imports.ui.appFavorites;

var AppGridButton = GObject.registerClass(
class AppGridButton extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'AppGridButton');
        
        this.app_grid_button = new St.BoxLayout({
            visible: true, 
            reactive: true, 
            can_focus: true, 
            track_hover: true
        });

        this.app_grid_button.icon = new St.Icon({
            icon_name: 'view-app-grid-symbolic', 
            style_class: 'system-status-icon'
        });

        this.app_grid_button.add_child(this.app_grid_button.icon);
        this.app_grid_button.connect('button-release-event', this._show_apps_page.bind(this));
        
        this.add_child(this.app_grid_button);
    }

    _show_apps_page() {
        if (Main.overview.visible) {
            Main.overview.hide();
        } else {
            Main.overview.showApps();
        }
    }
    
    _destroy() {
        super.destroy();
    }
});

var FavouritesMenu = GObject.registerClass(
class FavouritesMenu extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'FavouritesMenu');
        
        this.favourites_changed_connection = AppFavorites.getAppFavorites().connect('changed', this._display_favourites.bind(this));
        
        this.favourites_menu_button = new St.BoxLayout({
            visible: true, 
            reactive: true, 
            can_focus: true, 
            track_hover: true
        });
        this.favourites_menu_icon = new St.Icon({
            icon_name: 'starred-symbolic', 
            style_class: 'system-status-icon'
        });

        this.favourites_menu_button.add_child(this.favourites_menu_icon);
        this.add_child(this.favourites_menu_button);

        this._display_favourites();
    }
    
    _display_favourites() {
        // destroy old menu items
        if (this.menu) {
            this.menu.removeAll();
        }
        
        // create favorites items
        for (const favourite of AppFavorites.getAppFavorites().getFavorites()) {
            this.item = new PopupMenu.PopupImageMenuItem(favourite.get_name(), favourite.get_icon());
            this.item.connect('activate', () => favourite.open_new_window(-1));
            this.menu.addMenuItem(this.item);
        }
    }
    
    // remove signals, destroy workspaces bar
    _destroy() {
        if (this.favourites_changed_connection) {
            AppFavorites.getAppFavorites().disconnect(this.favourites_changed_connection);
        }
        super.destroy();
    }
});

this.init = function() {
    ExtensionUtils.initTranslations(GETTEXT_DOMAIN);

    // Applications
    this.applications = new AppGridButton();
    Main.panel.addToStatusArea('app-grid-button', this.applications, 1, 'left');

    // Favourites
    this.favourites = new FavouritesMenu();
    Main.panel.addToStatusArea('favourites-menu', this.favourites, 2, 'left');

    // App Menu
    //this.appMenu = Main.panel.statusArea['appMenu'];
    // if (this.appMenu) {
    //     this.appMenu.remove_child(this.appMenu.get_first_child());
    //     this.appMenu_icon = new St.Icon({
    //         icon_name: 'go-home-symbolic',
    //         style_class: 'system-status-icon'
    //     });
    //     this.appMenu.add_child(this.appMenu_icon);
    // }

    // Activites
    //this.Main.panel.statusArea['activities'].visible = false;
    this.activities = Main.panel.statusArea['activities'];
    if (this.activities) {
        this.activities.remove_child(this.activities.get_first_child());
        this.activities_icon = new St.Icon({
            icon_name: 'go-home-symbolic',
            style_class: 'system-status-icon'
        });
        this.activities.add_child(this.activities_icon);
    }

    // Places
    this.places = Main.panel.statusArea['places-menu'];
    if (this.places) {
        this.places.remove_child(this.places.get_first_child());
        this.places_icon = new St.Icon({
            icon_name: 'folder-symbolic', 
            style_class: 'system-status-icon'
        });
        this.places.add_child(this.places_icon);
    }
}

this.destroy = function() {
    // Applications
    this.applications.destroy();
    this.applications = null;

    // Favourites
    this.favourites.destroy();
    this.favourites = null;

    //Main.panel.statusArea['appMenu'].visible = false;

    // App Menu
    // this.appMenu = Main.panel.statusArea['appMenu'];
    // if (this.appMenu) {
    //     this.appMenu.remove_child(this.appMenu.get_first_child());
    //     this.appMenu_label = new St.Label({
    //         text: _('Activities'), 
    //         y_expand: true, 
    //         y_align: Clutter.ActorAlign.CENTER});
    //     this.appMenu.add_child(this.appMenu_label);
    // }

    // Activities
    //Main.panel.statusArea['activities'].visible = true;
    this.activities = Main.panel.statusArea['activities'];
    if (this.activities) {
        this.activities.remove_child(this.activities.get_first_child());
        this.activities_label = new St.Label({
            text: _('Activities'), 
            y_expand: true, 
            y_align: Clutter.ActorAlign.CENTER});
        this.activities.add_child(this.activities_label);
    }

    // Places
    this.places = Main.panel.statusArea['places-menu'];
    if (this.places) {
        this.places.remove_child(this.places.get_first_child());
        this.places_label = new St.Label({
            text: _('Places'), 
            y_expand: true, 
            y_align: Clutter.ActorAlign.CENTER});
        this.places.add_child(this.places_label);
    }
}