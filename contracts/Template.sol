/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 *
 * This file requires contract dependencies which are licensed as
 * GPL-3.0-or-later, forcing it to also be licensed as such.
 *
 * This is the only file in your project that requires this license and
 * you are free to choose a different license for the rest of the project.
 */

pragma solidity 0.4.24;

import "@aragon/os/contracts/factory/DAOFactory.sol";
import "@aragon/os/contracts/apm/Repo.sol";
import "@aragon/os/contracts/lib/ens/ENS.sol";
import "@aragon/os/contracts/lib/ens/PublicResolver.sol";
import "@aragon/os/contracts/apm/APMNamehash.sol";

import "@aragon/apps-vault/contracts/Vault.sol";
import "@aragon/apps-finance/contracts/Finance.sol";
import "@aragon/apps-token-manager/contracts/TokenManager.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";

import "./SmartFundApp.sol";


contract TemplateBase is APMNamehash {
    ENS public ens;
    DAOFactory public fac;

    event DeployInstance(address dao);
    event InstalledApp(address appProxy, bytes32 appId);

    constructor(DAOFactory _fac, ENS _ens) public {
        ens = _ens;

        // If no factory is passed, get it from on-chain bare-kit
        if (address(_fac) == address(0)) {
            bytes32 bareKit = apmNamehash("bare-kit");
            fac = TemplateBase(latestVersionAppBase(bareKit)).fac();
        } else {
            fac = _fac;
        }
    }

    function latestVersionAppBase(bytes32 appId) public view returns (address base) {
        Repo repo = Repo(PublicResolver(ens.resolver(appId)).addr(appId));
        (,base,) = repo.getLatest();

        return base;
    }
}


contract Template is TemplateBase {
    MiniMeTokenFactory tokenFactory;

    uint64 constant PCT = 10 ** 16;
    address constant ANY_ENTITY = address(-1);

    constructor(ENS ens) TemplateBase(DAOFactory(0), ens) public {
        tokenFactory = new MiniMeTokenFactory();
    }

    function _setupToken(Kernel dao, ACL acl, address root) private {
      bytes32 tokenManagerAppId = apmNamehash("token-manager");
      TokenManager tokenManager = TokenManager(dao.newAppInstance(tokenManagerAppId, latestVersionAppBase(tokenManagerAppId)));

      MiniMeToken token = tokenFactory.createCloneToken(MiniMeToken(0), 0, "App token", 0, "APP", true);
      token.changeController(tokenManager);

      tokenManager.initialize(token, true, 0);

      acl.createPermission(this, tokenManager, tokenManager.MINT_ROLE(), this);
      tokenManager.mint(root, 1); // Give one token to root
    }

    function _setupFinance(Kernel dao, ACL acl) private {
      bytes32 vaultAppId = apmNamehash("vault");
      bytes32 financeAppId = apmNamehash("finance");

      Vault vault = Vault(dao.newAppInstance(vaultAppId, latestVersionAppBase(vaultAppId)));
      Finance finance = Finance(dao.newAppInstance(financeAppId, latestVersionAppBase(financeAppId)));

      vault.initialize();
      finance.initialize(vault, 1 days);

      acl.createPermission(this, finance, finance.CREATE_PAYMENTS_ROLE(), this);
      acl.createPermission(this, finance, finance.CHANGE_PERIOD_ROLE(), this);
      acl.createPermission(this, finance, finance.CHANGE_BUDGETS_ROLE(), this);
      acl.createPermission(this, finance, finance.EXECUTE_PAYMENTS_ROLE(), this);
      acl.createPermission(this, finance, finance.MANAGE_PAYMENTS_ROLE(), this);

      acl.createPermission(this, vault, vault.TRANSFER_ROLE(), this);
      acl.grantPermission(finance, vault, vault.TRANSFER_ROLE());
    }

    function _setupApp(Kernel dao, ACL acl) private {
      bytes32 appId = apmNamehash("smartfund");

      SmartFundApp app = SmartFundApp(dao.newAppInstance(appId, latestVersionAppBase(appId)));

      // Initialize apps
      app.initialize();

      acl.createPermission(this, app, app.INVESTMENT_ROLE(), this);
      acl.createPermission(this, app, app.PROPOSE_STRATEGY_CHANGE_ROLE(), this);
      acl.createPermission(this, app, app.APPROVE_STRATEGY_CHANGE_ROLE(), this);
    }

    function newInstance() public {
        Kernel dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());
        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);

        address root = msg.sender;

        _setupToken(dao, acl, root);
        _setupFinance(dao, acl);
        _setupApp(dao, acl);

        // Clean up permissions
        acl.grantPermission(root, dao, dao.APP_MANAGER_ROLE());
        acl.revokePermission(this, dao, dao.APP_MANAGER_ROLE());
        acl.setPermissionManager(root, dao, dao.APP_MANAGER_ROLE());

        acl.grantPermission(root, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.setPermissionManager(root, acl, acl.CREATE_PERMISSIONS_ROLE());

        emit DeployInstance(dao);
    }
}
