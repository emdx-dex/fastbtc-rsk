require('chai').should();
const { accounts, contract } = require('@openzeppelin/test-environment');
const {
  BN,
  expectEvent,
  expectRevert,
  constants,
  ether
} = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

const FastSwap = contract.fromArtifact('FastSwap');

describe('FastSwap contract', () => {
  const [owner, operator, otherAccount] = accounts;
  const MAX_AMOUNT = new BN("10000000000000000000");
  const MIN_AMOUNT = new BN("1000000000000000000");

  describe('constructor parameters', async () => {
    it('check operator', async () => {
      await expectRevert(FastSwap.new(
        ZERO_ADDRESS,
        MAX_AMOUNT,
        MIN_AMOUNT,
        { from: owner }
      ),
        "_operator is required"
      );
    });

    it('check max and min amounts', async () => {
      await expectRevert(FastSwap.new(
        operator,
        0,
        MIN_AMOUNT,
        { from: owner }
      ),
        "_maxAmount is required"
      );

      await expectRevert(FastSwap.new(
        operator,
        MAX_AMOUNT,
        0,
        { from: owner }
      ),
        "_minAmount is required"
      );
    });
  });

  describe('state variables', async () => {
    beforeEach(async () => {
      this.contract = await FastSwap.new(
        operator,
        MAX_AMOUNT,
        MIN_AMOUNT,
        { from: owner }
      );
    });

    it('check max amount', async () => {
      (await this.contract.maxAmount()).should.be.bignumber.equal(MAX_AMOUNT);
    });

    it('check min amount', async () => {
      (await this.contract.minAmount()).should.be.bignumber.equal(MIN_AMOUNT);
    });

    it('check owner', async () => {
      (await this.contract.owner()).should.equal(owner);
    });

    it('check owner admin role', async () => {
      const DEFAULT_ADMIN_ROLE = await this.contract.DEFAULT_ADMIN_ROLE();
      (await this.contract.hasRole(DEFAULT_ADMIN_ROLE, owner)).should.equal(true);
    });

    it('check operator role', async () => {
      const OPERATOR_ROLE = await this.contract.OPERATOR_ROLE();
      (await this.contract.hasRole(OPERATOR_ROLE, operator)).should.equal(true);
    });
  });

  describe('roles on set max and min amounts', async () => {
    const NEW_MAX_AMOUNT = new BN("10000000000000000000000");
    const NEW_MIN_AMOUNT = new BN("1000000000000000");

    beforeEach(async () => {
      this.contract = await FastSwap.new(
        operator,
        MAX_AMOUNT,
        MIN_AMOUNT,
        { from: owner }
      );
    });

    it('check set max amount', async () => {
      await expectRevert(
        this.contract.setMaxAmount(NEW_MAX_AMOUNT, { from: operator }),
        "Ownable: caller is not the owner"
      );
      await expectRevert(
        this.contract.setMaxAmount(0, { from: owner }),
        "_newAmount is required"
      );
      await this.contract.setMaxAmount(NEW_MAX_AMOUNT, { from: owner });

      (await this.contract.maxAmount()).should.be.bignumber.equal(NEW_MAX_AMOUNT);
    });

    it('check set min amount', async () => {
      await expectRevert(
        this.contract.setMinAmount(NEW_MIN_AMOUNT, { from: operator }),
        "Ownable: caller is not the owner"
      );
      await expectRevert(
        this.contract.setMinAmount(0, { from: owner }),
        "_newAmount is required"
      );
      await this.contract.setMinAmount(NEW_MIN_AMOUNT, { from: owner });

      (await this.contract.minAmount()).should.be.bignumber.equal(NEW_MIN_AMOUNT);
    });
  });

  describe('swap in and swap out', async () => {
    beforeEach(async () => {
      this.contract = await FastSwap.new(
        operator,
        MAX_AMOUNT,
        MIN_AMOUNT,
        { from: owner }
      );
    });

    it('check requiremend on swap out', async () => {
      const UNDER_MIN_AMOUNT = new BN("100000000000000000");
      const ABOVE_MAX_AMOUNT = new BN("20000000000000000000");
      const RIGHT_AMOUNT =     new BN("2000000000000000000");
      await expectRevert(
        this.contract.send(UNDER_MIN_AMOUNT, { from: otherAccount }),
        "amount does not reach the minimum required"
      );
      await expectRevert(
        this.contract.send(ABOVE_MAX_AMOUNT, { from: otherAccount }),
        "amount exceeds the maximum required"
      );
      const { logs } = await this.contract.send(RIGHT_AMOUNT, { from: otherAccount });
      expectEvent.inLogs(logs, 'RBTCSwapOut', {
        source: otherAccount,
        amount: RIGHT_AMOUNT,
      });

      await this.contract.send(MIN_AMOUNT, { from: otherAccount });
      await this.contract.send(MAX_AMOUNT, { from: otherAccount });
    });
  });
});
