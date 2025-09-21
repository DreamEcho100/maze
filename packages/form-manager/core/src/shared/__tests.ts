// @ts-nocheck

import type { NestedPath } from "./types";

type Test_1_NestedPath = NestedPath<{
	a: { b: { c: [{ e: string }] } };
	d: number[];
}>; // Expected: "a" | "a.b" | "a.b.c" | "a.b.c.0" | "a.b.c.0.e" | "d" | "d.0"
//^?
const test_1_1 = "a.b.c.0.e" satisfies Test_1_NestedPath; // ok
const test_1_2 = "d" satisfies Test_1_NestedPath; // ok// ok
const test_1_3 = "d.0" satisfies Test_1_NestedPath; // ok
type Test_2_NestedPath = NestedPath<[0, { a: { c: 0 } }]>; // Expected: "0" | "1" | "1.a" | "1.a.c"
//^?
const test_2_1 = "1.a.c" satisfies Test_2_NestedPath; // ok
const test_2_2 = "0" satisfies Test_2_NestedPath; // ok
const test_2_3 = "1.a" satisfies Test_2_NestedPath; // ok
const test_2_4 = "1" satisfies Test_2_NestedPath; // ok
type Test_3_NestedPath = NestedPath<{ a: { b: string[] } }>; // Expected: "a" | "a.b" | "a.b.0"
//^?
const test_3_1 = "a" satisfies Test_3_NestedPath; // ok
const test_3_2 = "a.b.2" satisfies Test_3_NestedPath; // ok
const test_3_3 = "a.b.ddd" satisfies Test_3_NestedPath; // should error, ok
const test_3_4 = "a.b.3.4" satisfies Test_3_NestedPath; // should error, and it doesn't, not ok
const test_3_5 = "a.b.3.4.5" satisfies Test_3_NestedPath; // should error, ok

/*
// Test with a complex nested structure
type DeepNestedObject = {
	level1: {
		level2: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2Array: Array<{
			level3: {
				level4: {
					level5: {
						level6: {};
					};
				};
			};
		}>;
	};
	level1_1: {
		level2: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2Array: Array<{
			level3: {
				level4: {
					level5: {
						level6: {};
					};
				};
			};
		}>;
	};
	level1_2: {
		level2: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2Array: Array<{
			level3: {
				level4: {
					level5: {
						level6: {};
					};
				};
			};
		}>;
	};
	level1_3: {
		level2: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_1: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_3: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_4: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2Array: Array<{
			level3: {
				level4: {
					level5: {
						level6: {};
					};
				};
			};
		}>;
	};
	level1_4: {
		level2: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_1: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_3: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_4: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2Array: Array<{
			level3: {
				level4: {
					level5: {
						level6: {};
					};
				};
			};
		}>;
	};
	level1_5: {
		level2: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_1: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_3: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_4: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_5: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2Array: Array<{
			level3: {
				level4: {
					level5: {
						level6: {};
					};
				};
			};
		}>;
	};
	level1_6: {
		level2: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_1: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_3: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_4: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_5: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2Array: Array<{
			level3: {
				level4: {
					level5: {
						level6: {};
					};
				};
			};
		}>;
	};
	level1_7: {
		level2: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_1: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_3: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_4: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_5: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2Array: Array<{
			level3: {
				level4: {
					level5: {
						level6: {};
					};
				};
			};
		}>;
	};
	level1_8: {
		level2: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_1: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_3: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_4: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_5: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2Array: Array<{
			level3: {
				level4: {
					level5: {
						level6: {};
					};
				};
			};
		}>;
	};
	level1_9: {
		level2: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_1: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_3: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_4: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2_5: {
			level3: {
				level4: {
					level5: {
						level6: {
							level7: {
								level8: {
									level9: {
										level10: {
											level11: {
												level12: {
													level13: {
														level14: {
															level15: {
																level16: {
																	level17: {
																		level18: {
																			level19: {
																				level20: {
																					level21: {
																						level22: {
																							level23: {
																								// level24: {
																								finalLevel: string;
																								// };
																							};
																						};
																					};
																				};
																			};
																		};
																	};
																};
															};
														};
													};
												};
											};
										};
									};
								};
							};
						};
					};
				};
			};
		};
		level2Array: Array<{
			level3: {
				level4: {
					level5: {
						level6: {};
					};
				};
			};
		}>;
	};
};
type Solution1 = NestedPath<DeepNestedObject>;
*/
