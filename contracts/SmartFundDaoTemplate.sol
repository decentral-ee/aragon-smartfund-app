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

import "@aragon/apps-voting/contracts/Voting.sol";
import "@aragon/apps-vault/contracts/Vault.sol";
import "@aragon/apps-token-manager/contracts/TokenManager.sol";
import "@aragon/apps-finance/contracts/Finance.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";

import "./TemplateBase.sol";
import "./SmartFundApp.sol";

contract SmartFundDaoTemplate is TemplateBase {
    MiniMeTokenFactory tokenFactory;

    uint64 constant PCT = 10 ** 16;
    address constant ANY_ENTITY = address(-1);

    constructor(ENS ens) TemplateBase(DAOFactory(0), ens) public {
        tokenFactory = new MiniMeTokenFactory();
    }

    function _setupTokenManager(Kernel dao, ACL acl, address root) private
      returns (MiniMeToken token, TokenManager tokenManager) {
      bytes32 tokenManagerAppId = apmNamehash("token-manager");
      tokenManager = TokenManager(dao.newAppInstance(tokenManagerAppId, latestVersionAppBase(tokenManagerAppId)));

      token = tokenFactory.createCloneToken(MiniMeToken(0), 0, "App token", 0, "APP", true);
      token.changeController(tokenManager);

      tokenManager.initialize(token, true, 0);

      acl.createPermission(this, tokenManager, tokenManager.MINT_ROLE(), this);
      tokenManager.mint(root, 1); // Give one token to root
    }

    function _setupVotingApp(Kernel dao, ACL acl, MiniMeToken token) private
      returns (Voting voting) {
      bytes32 votingAppId = apmNamehash("voting");
      voting = Voting(dao.newAppInstance(votingAppId, latestVersionAppBase(votingAppId)));

      voting.initialize(token, 50 * PCT, 20 * PCT, 1 days);
      acl.createPermission(this, voting, voting.CREATE_VOTES_ROLE(), this);
    }

    function _setupFinanceApp(Kernel dao, ACL acl, Voting voting, address root) private {
      bytes32 vaultAppId = apmNamehash("vault");
      bytes32 financeAppId = apmNamehash("finance");

      Vault vault = Vault(dao.newAppInstance(vaultAppId, latestVersionAppBase(vaultAppId)));
      Finance finance = Finance(dao.newAppInstance(financeAppId, latestVersionAppBase(financeAppId)));

      vault.initialize();
      finance.initialize(vault, 1 days);

      acl.createPermission(voting, finance, finance.CREATE_PAYMENTS_ROLE(), root);
      acl.createPermission(voting, finance, finance.CHANGE_PERIOD_ROLE(), root);
      acl.createPermission(voting, finance, finance.CHANGE_BUDGETS_ROLE(), root);
      acl.createPermission(voting, finance, finance.EXECUTE_PAYMENTS_ROLE(), root);
      acl.createPermission(voting, finance, finance.MANAGE_PAYMENTS_ROLE(), root);

      acl.createPermission(finance, vault, vault.TRANSFER_ROLE(), root);
    }

    function _setupSmartFundApp(Kernel dao, ACL acl, Voting voting, address root) private {
      bytes32 appId = apmNamehash("smartfund");

      SmartFundApp app = SmartFundApp(dao.newAppInstance(appId, latestVersionAppBase(appId)));

      // Initialize apps
      app.initialize();

      acl.createPermission(ANY_ENTITY, app, app.INVESTMENT_ROLE(), root);
      acl.createPermission(root, app, app.FUND_MANAGER_ROLE(), root);
      acl.createPermission(voting, app, app.STRATEGY_CHANGE_ROLE(), root);
    }

    function newInstance() public {
        Kernel dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());
        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);

        address root = msg.sender;

        (MiniMeToken token, TokenManager tokenManager) = _setupTokenManager(dao, acl, root);
        (Voting voting) = _setupVotingApp(dao, acl, token);
        _setupFinanceApp(dao, acl, voting, root);
        _setupSmartFundApp(dao, acl, voting, root);

        // Clean up permissions
        acl.grantPermission(root, dao, dao.APP_MANAGER_ROLE());
        acl.revokePermission(this, dao, dao.APP_MANAGER_ROLE());
        acl.setPermissionManager(root, dao, dao.APP_MANAGER_ROLE());

        acl.grantPermission(root, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.setPermissionManager(root, acl, acl.CREATE_PERMISSIONS_ROLE());

        acl.grantPermission(root, tokenManager, tokenManager.MINT_ROLE());
        acl.revokePermission(this, tokenManager, tokenManager.MINT_ROLE());
        acl.setPermissionManager(root, tokenManager, tokenManager.MINT_ROLE());

        acl.grantPermission(root, voting, voting.CREATE_VOTES_ROLE());
        acl.revokePermission(this, voting, voting.CREATE_VOTES_ROLE());
        acl.setPermissionManager(root, voting, voting.CREATE_VOTES_ROLE());

        emit DeployInstance(dao);
    }
}
