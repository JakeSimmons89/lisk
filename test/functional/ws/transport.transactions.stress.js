'use strict';

require('../functional.js');

var async = require('async');
var lisk = require('lisk-js');

var test = require('../../test');
var node = require('../../node');
var shared = require('../shared');
var accountFixtures = require('../../fixtures/accounts');

var apiCodes = require('../../../helpers/apiCodes');
var constants = require('../../../helpers/constants');

var ws = require('../../common/ws/communication');
var waitFor = require('../../common/utils/waitFor');
var randomUtil = require('../../common/utils/random');

function postTransactions (transactions, done) {
	ws.call('postTransactions', {
		transactions: transactions
	}, done, true);
}

describe('postTransactions @slow', function () {

	describe('sending 1000 bundled transfers to random addresses', function () {

		var transactions = [];
		var maximum = 1000;
		var count = 1;

		before(function (done) {
			async.doUntil(function (next) {
				var bundled = [];

				for (var i = 0; i < test.config.broadcasts.releaseLimit; i++) {
					var transaction = lisk.transaction.createTransaction(
						randomUtil.account().address,
						randomUtil.number(100000000, 1000000000),
						accountFixtures.genesis.password
					);

					transactions.push(transaction);
					bundled.push(transaction);
					count++;
				}

				postTransactions(bundled, function (err, res) {
					node.expect(res).to.have.property('success').to.be.ok;
					next();
				});
			}, function () {
				return (count >= maximum);
			}, function (err) {
				node.expect(err).to.be.null;
				var blocksToWait = Math.ceil(maximum / constants.maxTxsPerBlock);
				waitFor.blocks(blocksToWait, function (err, res) {
					done();
				});
			});
		});

		shared.confirmationPhase(transactions);
	});

	describe('sending 1000 single transfers to random addresses', function () {

		var transactions = [];
		var maximum = 1000;
		var count = 1;

		before(function (done) {
			async.doUntil(function (next) {
				var transaction = lisk.transaction.createTransaction(
					randomUtil.account().address,
					randomUtil.number(100000000, 1000000000),
					accountFixtures.genesis.password
				);

				postTransactions([transaction], function (err, res) {
					node.expect(res).to.have.property('success').to.be.ok;
					node.expect(res).to.have.property('transactionId').to.equal(transaction.id);
					transactions.push(transaction);
					count++;
					next();
				});
			}, function () {
				return (count >= maximum);
			}, function (err) {
				node.expect(err).to.be.null;
				var blocksToWait = Math.ceil(maximum / constants.maxTxsPerBlock);
				waitFor.blocks(blocksToWait, function (err, res) {
					done();
				});
			});
		});

		shared.confirmationPhase(transactions);
	});
});
