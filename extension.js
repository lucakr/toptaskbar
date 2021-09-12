/* extension.js
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

const { GObject, St } = imports.gi;

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
    

class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        Main.panel.statusArea['activities'].visible = false;
        Main.panel.statusArea['appMenu'].visible = false;

        this._app_grid_button = new AppGridButton();
        Main.panel.addToStatusArea('app-grid-button', this._app_grid_button, 0 , 'left');

        this._favourites_menu = new FavouritesMenu();
        Main.panel.addToStatusArea('favourites-menu', this._favourites_menu, 3, 'left');
    }

    disable() {
        Main.panel.statusArea['activities'].visible = true;
        Main.panel.statusArea['appMenu'].visible = true;

        this._app_grid_button.destroy();
        this._app_grid_button = null;

        this._favourites_menu.destroy();
        this._favourites_menu = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
