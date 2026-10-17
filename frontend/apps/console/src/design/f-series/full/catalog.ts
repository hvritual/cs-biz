// Review navigation and state inventory; domain views remain explicit Vue components.
export const reviewPages = [
  {
    "id": "identity",
    "screen": "UI-01",
    "title": [
      "登录与身份验证",
      "Sign in"
    ],
    "group": "identity",
    "acceptance": [
      "AC03",
      "AC04"
    ],
    "audience": "public",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "login_failed",
        "title": [
          "登录验证失败",
          "Sign-in verification failed"
        ],
        "help": [
          "未能确认本次登录。请重新从登录入口开始，旧验证信息不能重用。",
          "This sign-in could not be verified. Start again; previous verification cannot be reused."
        ],
        "kind": "error"
      },
      {
        "id": "transaction_expired",
        "title": [
          "登录请求已失效",
          "Sign-in request expired"
        ],
        "help": [
          "本次登录请求已过期或已使用。请重新发起登录。",
          "This sign-in request expired or was already used. Start a new sign-in."
        ],
        "kind": "error"
      },
      {
        "id": "identity_mismatch",
        "title": [
          "账号不匹配",
          "Account mismatch"
        ],
        "help": [
          "当前账号与目标记录不匹配。请切换到正确的组织账号，不会自动合并身份。",
          "This account does not match the target. Use the correct organization account; identities are not automatically merged."
        ],
        "kind": "denied"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "organizations",
    "screen": "UI-02",
    "title": [
      "选择企业",
      "Choose organization"
    ],
    "group": "identity",
    "acceptance": [
      "AC05"
    ],
    "audience": "authenticated",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "one",
        "title": [
          "一家企业",
          "One organization"
        ],
        "help": [
          "只有一家可访问企业，确认后进入。",
          "One accessible organization is available. Confirm to enter."
        ],
        "kind": "ready"
      },
      {
        "id": "zero",
        "title": [
          "尚未加入企业",
          "No organization membership"
        ],
        "help": [
          "联系企业负责人邀请加入，或切换到已有企业的账号。",
          "Ask an owner for an invitation or use an account with an organization."
        ],
        "kind": "empty"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "switch_failed",
        "title": [
          "企业切换失败",
          "Organization switch failed"
        ],
        "help": [
          "目标企业未能验证，旧企业权限已清理。可返回企业选择后重试。",
          "The target organization could not be verified. Previous access is cleared. Return to organization selection."
        ],
        "kind": "error"
      },
      {
        "id": "suspended",
        "title": [
          "成员已停用",
          "Member suspended"
        ],
        "help": [
          "当前成员已停用，不能继续访问企业数据。",
          "This membership is suspended and cannot access organization data."
        ],
        "kind": "denied"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "sessions",
    "screen": "UI-03",
    "title": [
      "账号与登录设备",
      "Account and sessions"
    ],
    "group": "identity",
    "acceptance": [
      "AC03",
      "AC06"
    ],
    "audience": "authenticated",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "empty",
        "title": [
          "暂无记录",
          "No records"
        ],
        "help": [
          "当前条件下没有记录。可调整筛选或返回上一步。",
          "No records match. Adjust filters or return to the previous step."
        ],
        "kind": "empty"
      },
      {
        "id": "expired",
        "title": [
          "已过期",
          "Expired"
        ],
        "help": [
          "此记录已过有效期。请重新核对资格或申请新的有效记录。",
          "This record has expired. Review eligibility or request a new valid record."
        ],
        "kind": "error"
      },
      {
        "id": "revoked",
        "title": [
          "权限已撤销",
          "Access revoked"
        ],
        "help": [
          "权限已变化。已阻止后续操作，请重新核对当前权限。",
          "Access changed. Further actions are blocked until current permissions are checked."
        ],
        "kind": "denied"
      },
      {
        "id": "csrf",
        "title": [
          "安全校验失效",
          "Security check expired"
        ],
        "help": [
          "请刷新安全校验并重新确认。已保留输入，没有自动重提。",
          "Refresh the security check and confirm again. Input is preserved and no request was automatically resubmitted."
        ],
        "kind": "error"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "invitation-accept",
    "screen": "UI-04",
    "title": [
      "接受企业邀请",
      "Accept invitation"
    ],
    "group": "identity",
    "acceptance": [
      "AC06"
    ],
    "audience": "public",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "expired",
        "title": [
          "已过期",
          "Expired"
        ],
        "help": [
          "此记录已过有效期。请重新核对资格或申请新的有效记录。",
          "This record has expired. Review eligibility or request a new valid record."
        ],
        "kind": "error"
      },
      {
        "id": "withdrawn",
        "title": [
          "邀请已撤回",
          "Invitation withdrawn"
        ],
        "help": [
          "此邀请已撤回，不能继续接受。请联系邀请人。",
          "This invitation was withdrawn and cannot be accepted. Contact the inviter."
        ],
        "kind": "denied"
      },
      {
        "id": "used",
        "title": [
          "邀请已被使用",
          "Invitation already used"
        ],
        "help": [
          "此邀请已经接受，不会再次建立成员关系。",
          "This invitation was already accepted. Another membership will not be created."
        ],
        "kind": "denied"
      },
      {
        "id": "identity_mismatch",
        "title": [
          "账号不匹配",
          "Account mismatch"
        ],
        "help": [
          "当前账号与目标记录不匹配。请切换到正确的组织账号，不会自动合并身份。",
          "This account does not match the target. Use the correct organization account; identities are not automatically merged."
        ],
        "kind": "denied"
      },
      {
        "id": "suspended",
        "title": [
          "成员已停用",
          "Member suspended"
        ],
        "help": [
          "当前成员已停用，不能继续访问企业数据。",
          "This membership is suspended and cannot access organization data."
        ],
        "kind": "denied"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "tenants",
    "screen": "UI-05",
    "title": [
      "企业管理",
      "Organizations"
    ],
    "group": "platform",
    "acceptance": [
      "AC05",
      "AC06"
    ],
    "audience": "platform",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "empty",
        "title": [
          "暂无记录",
          "No records"
        ],
        "help": [
          "当前条件下没有记录。可调整筛选或返回上一步。",
          "No records match. Adjust filters or return to the previous step."
        ],
        "kind": "empty"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "tenant-create",
    "screen": "UI-06",
    "title": [
      "创建企业",
      "Create organization"
    ],
    "group": "platform",
    "acceptance": [
      "AC05",
      "AC06"
    ],
    "audience": "platform",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "invalid",
        "title": [
          "输入需要修正",
          "Input needs attention"
        ],
        "help": [
          "请修正标记的内容，核对后才能继续。",
          "Correct the highlighted entries before continuing."
        ],
        "kind": "warning"
      },
      {
        "id": "duplicate",
        "title": [
          "发现重复记录",
          "Duplicate records"
        ],
        "help": [
          "重复项已单独标出，不会重复选定或重复创建。",
          "Duplicates are listed separately and will not be selected or created twice."
        ],
        "kind": "warning"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      },
      {
        "id": "csrf",
        "title": [
          "安全校验失效",
          "Security check expired"
        ],
        "help": [
          "请刷新安全校验并重新确认。已保留输入，没有自动重提。",
          "Refresh the security check and confirm again. Input is preserved and no request was automatically resubmitted."
        ],
        "kind": "error"
      },
      {
        "id": "conflict",
        "title": [
          "记录版本已变化",
          "Version conflict"
        ],
        "help": [
          "其他人已修改记录。先读取最新版本，再核对差异；不会覆盖新内容。",
          "Someone changed this record. Reload the latest version and review differences before saving."
        ],
        "kind": "error"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "failed",
        "title": [
          "处理失败",
          "Processing failed"
        ],
        "help": [
          "本次处理未完成。核对失败原因与原操作记录后再决定下一步。",
          "Processing did not complete. Review the reason and original record before deciding the next step."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "tenant",
    "screen": "UI-07",
    "title": [
      "企业详情",
      "Organization detail"
    ],
    "group": "platform",
    "acceptance": [
      "AC05",
      "AC06"
    ],
    "audience": "platform",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "not_found",
        "title": [
          "记录不可访问",
          "Record unavailable"
        ],
        "help": [
          "未找到可访问的记录。不能据此判断其他企业是否存在该对象。",
          "No accessible record was found. This does not disclose records in other organizations."
        ],
        "kind": "empty"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      },
      {
        "id": "pending_owner",
        "title": [
          "等待负责人加入",
          "Awaiting owner activation"
        ],
        "help": [
          "企业已建立，指定负责人仍需验证身份并接受邀请。创建者不会自动获得企业负责人权限。",
          "The organization exists; its nominated owner must verify identity and accept. Its creator does not automatically become an owner."
        ],
        "kind": "warning"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "module-grant",
    "screen": "UI-08",
    "title": [
      "开通企业模块",
      "Enable modules"
    ],
    "group": "platform",
    "acceptance": [
      "AC07"
    ],
    "audience": "platform",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "unpublished",
        "title": [
          "模块不可开通",
          "Module not published"
        ],
        "help": [
          "只能选择已发布且可开通的模块，未发布项不会生效。",
          "Only published, available modules can be enabled. Unpublished entries cannot take effect."
        ],
        "kind": "denied"
      },
      {
        "id": "module_closed",
        "title": [
          "模块未开通",
          "Module unavailable"
        ],
        "help": [
          "此企业尚未开通该模块或模块已关闭。已有角色不能替代模块开通。",
          "This module is not active for the organization. A role does not enable a module."
        ],
        "kind": "denied"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      },
      {
        "id": "conflict",
        "title": [
          "记录版本已变化",
          "Version conflict"
        ],
        "help": [
          "其他人已修改记录。先读取最新版本，再核对差异；不会覆盖新内容。",
          "Someone changed this record. Reload the latest version and review differences before saving."
        ],
        "kind": "error"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "failed",
        "title": [
          "处理失败",
          "Processing failed"
        ],
        "help": [
          "本次处理未完成。核对失败原因与原操作记录后再决定下一步。",
          "Processing did not complete. Review the reason and original record before deciding the next step."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "members",
    "screen": "UI-09",
    "title": [
      "企业成员",
      "Members"
    ],
    "group": "access",
    "acceptance": [
      "AC06"
    ],
    "audience": "delegated_admin",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "empty",
        "title": [
          "暂无记录",
          "No records"
        ],
        "help": [
          "当前条件下没有记录。可调整筛选或返回上一步。",
          "No records match. Adjust filters or return to the previous step."
        ],
        "kind": "empty"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      },
      {
        "id": "last_owner",
        "title": [
          "最后一位负责人",
          "Last active owner"
        ],
        "help": [
          "企业至少保留一名在任负责人。请先指定另一位负责人。",
          "An organization needs an active owner. Assign another owner first."
        ],
        "kind": "denied"
      },
      {
        "id": "conflict",
        "title": [
          "记录版本已变化",
          "Version conflict"
        ],
        "help": [
          "其他人已修改记录。先读取最新版本，再核对差异；不会覆盖新内容。",
          "Someone changed this record. Reload the latest version and review differences before saving."
        ],
        "kind": "error"
      },
      {
        "id": "revoked",
        "title": [
          "权限已撤销",
          "Access revoked"
        ],
        "help": [
          "权限已变化。已阻止后续操作，请重新核对当前权限。",
          "Access changed. Further actions are blocked until current permissions are checked."
        ],
        "kind": "denied"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "invitations",
    "screen": "UI-10",
    "title": [
      "邀请记录",
      "Invitations"
    ],
    "group": "access",
    "acceptance": [
      "AC06"
    ],
    "audience": "delegated_admin",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "empty",
        "title": [
          "暂无记录",
          "No records"
        ],
        "help": [
          "当前条件下没有记录。可调整筛选或返回上一步。",
          "No records match. Adjust filters or return to the previous step."
        ],
        "kind": "empty"
      },
      {
        "id": "expired",
        "title": [
          "已过期",
          "Expired"
        ],
        "help": [
          "此记录已过有效期。请重新核对资格或申请新的有效记录。",
          "This record has expired. Review eligibility or request a new valid record."
        ],
        "kind": "error"
      },
      {
        "id": "delivery_failed",
        "title": [
          "邀请投递失败",
          "Invitation delivery failed"
        ],
        "help": [
          "邀请记录可能已创建。请先查询投递状态，不要重新创建整批。",
          "The invitation may already exist. Check delivery status before recreating any batch."
        ],
        "kind": "error"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "invite-create",
    "screen": "UI-11",
    "title": [
      "邀请成员",
      "Invite members"
    ],
    "group": "access",
    "acceptance": [
      "AC06"
    ],
    "audience": "delegated_admin",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "invalid",
        "title": [
          "输入需要修正",
          "Input needs attention"
        ],
        "help": [
          "请修正标记的内容，核对后才能继续。",
          "Correct the highlighted entries before continuing."
        ],
        "kind": "warning"
      },
      {
        "id": "duplicate",
        "title": [
          "发现重复记录",
          "Duplicate records"
        ],
        "help": [
          "重复项已单独标出，不会重复选定或重复创建。",
          "Duplicates are listed separately and will not be selected or created twice."
        ],
        "kind": "warning"
      },
      {
        "id": "ambiguous",
        "title": [
          "需要消歧",
          "Resolve ambiguous matches"
        ],
        "help": [
          "存在同名或不明确的匹配。请选择精确记录或排除该项。",
          "Some matches are ambiguous. Choose an exact record or exclude the item."
        ],
        "kind": "warning"
      },
      {
        "id": "scope_denied",
        "title": [
          "超出操作范围",
          "Outside action scope"
        ],
        "help": [
          "当前对象不在此动作的授权范围内。不会扩大到其他对象。",
          "The target is outside this action’s scope. Other targets will not be included."
        ],
        "kind": "denied"
      },
      {
        "id": "partial",
        "title": [
          "部分完成",
          "Partially completed"
        ],
        "help": [
          "逐项核对结果；已完成项不再提交，未知项先查询，明确失败项再处理。",
          "Review each result. Keep completed items, query unknown items, and handle confirmed failures separately."
        ],
        "kind": "warning"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "revoked",
        "title": [
          "权限已撤销",
          "Access revoked"
        ],
        "help": [
          "权限已变化。已阻止后续操作，请重新核对当前权限。",
          "Access changed. Further actions are blocked until current permissions are checked."
        ],
        "kind": "denied"
      },
      {
        "id": "csrf",
        "title": [
          "安全校验失效",
          "Security check expired"
        ],
        "help": [
          "请刷新安全校验并重新确认。已保留输入，没有自动重提。",
          "Refresh the security check and confirm again. Input is preserved and no request was automatically resubmitted."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "roles",
    "screen": "UI-12",
    "title": [
      "角色与权限",
      "Roles and permissions"
    ],
    "group": "access",
    "acceptance": [
      "AC06",
      "AC09"
    ],
    "audience": "delegated_admin",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "empty",
        "title": [
          "暂无记录",
          "No records"
        ],
        "help": [
          "当前条件下没有记录。可调整筛选或返回上一步。",
          "No records match. Adjust filters or return to the previous step."
        ],
        "kind": "empty"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      },
      {
        "id": "last_owner",
        "title": [
          "最后一位负责人",
          "Last active owner"
        ],
        "help": [
          "企业至少保留一名在任负责人。请先指定另一位负责人。",
          "An organization needs an active owner. Assign another owner first."
        ],
        "kind": "denied"
      },
      {
        "id": "conflict",
        "title": [
          "记录版本已变化",
          "Version conflict"
        ],
        "help": [
          "其他人已修改记录。先读取最新版本，再核对差异；不会覆盖新内容。",
          "Someone changed this record. Reload the latest version and review differences before saving."
        ],
        "kind": "error"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "role-edit",
    "screen": "UI-13",
    "title": [
      "配置角色",
      "Configure role"
    ],
    "group": "access",
    "acceptance": [
      "AC06",
      "AC09"
    ],
    "audience": "delegated_admin",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "invalid",
        "title": [
          "输入需要修正",
          "Input needs attention"
        ],
        "help": [
          "请修正标记的内容，核对后才能继续。",
          "Correct the highlighted entries before continuing."
        ],
        "kind": "warning"
      },
      {
        "id": "scope_denied",
        "title": [
          "超出操作范围",
          "Outside action scope"
        ],
        "help": [
          "当前对象不在此动作的授权范围内。不会扩大到其他对象。",
          "The target is outside this action’s scope. Other targets will not be included."
        ],
        "kind": "denied"
      },
      {
        "id": "last_owner",
        "title": [
          "最后一位负责人",
          "Last active owner"
        ],
        "help": [
          "企业至少保留一名在任负责人。请先指定另一位负责人。",
          "An organization needs an active owner. Assign another owner first."
        ],
        "kind": "denied"
      },
      {
        "id": "conflict",
        "title": [
          "记录版本已变化",
          "Version conflict"
        ],
        "help": [
          "其他人已修改记录。先读取最新版本，再核对差异；不会覆盖新内容。",
          "Someone changed this record. Reload the latest version and review differences before saving."
        ],
        "kind": "error"
      },
      {
        "id": "revoked",
        "title": [
          "权限已撤销",
          "Access revoked"
        ],
        "help": [
          "权限已变化。已阻止后续操作，请重新核对当前权限。",
          "Access changed. Further actions are blocked until current permissions are checked."
        ],
        "kind": "denied"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "csrf",
        "title": [
          "安全校验失效",
          "Security check expired"
        ],
        "help": [
          "请刷新安全校验并重新确认。已保留输入，没有自动重提。",
          "Refresh the security check and confirm again. Input is preserved and no request was automatically resubmitted."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "modules",
    "screen": "UI-14",
    "title": [
      "企业模块",
      "Organization modules"
    ],
    "group": "access",
    "acceptance": [
      "AC07"
    ],
    "audience": "member",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "empty",
        "title": [
          "暂无记录",
          "No records"
        ],
        "help": [
          "当前条件下没有记录。可调整筛选或返回上一步。",
          "No records match. Adjust filters or return to the previous step."
        ],
        "kind": "empty"
      },
      {
        "id": "module_closed",
        "title": [
          "模块未开通",
          "Module unavailable"
        ],
        "help": [
          "此企业尚未开通该模块或模块已关闭。已有角色不能替代模块开通。",
          "This module is not active for the organization. A role does not enable a module."
        ],
        "kind": "denied"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "campaigns",
    "screen": "UI-15",
    "title": [
      "营销活动",
      "Campaigns"
    ],
    "group": "marketing",
    "acceptance": [
      "AC07"
    ],
    "audience": "member",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "empty",
        "title": [
          "暂无记录",
          "No records"
        ],
        "help": [
          "当前条件下没有记录。可调整筛选或返回上一步。",
          "No records match. Adjust filters or return to the previous step."
        ],
        "kind": "empty"
      },
      {
        "id": "no_function",
        "title": [
          "没有操作权限",
          "Action not allowed"
        ],
        "help": [
          "可以看到入口不代表可以执行。请核对该动作的授权范围。",
          "Seeing an entry does not grant the action. Review its current permission and scope."
        ],
        "kind": "denied"
      },
      {
        "id": "module_closed",
        "title": [
          "模块未开通",
          "Module unavailable"
        ],
        "help": [
          "此企业尚未开通该模块或模块已关闭。已有角色不能替代模块开通。",
          "This module is not active for the organization. A role does not enable a module."
        ],
        "kind": "denied"
      },
      {
        "id": "suspended",
        "title": [
          "成员已停用",
          "Member suspended"
        ],
        "help": [
          "当前成员已停用，不能继续访问企业数据。",
          "This membership is suspended and cannot access organization data."
        ],
        "kind": "denied"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "campaign",
    "screen": "UI-16",
    "title": [
      "活动详情",
      "Campaign detail"
    ],
    "group": "marketing",
    "acceptance": [
      "AC07",
      "AC08"
    ],
    "audience": "member",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "not_found",
        "title": [
          "记录不可访问",
          "Record unavailable"
        ],
        "help": [
          "未找到可访问的记录。不能据此判断其他企业是否存在该对象。",
          "No accessible record was found. This does not disclose records in other organizations."
        ],
        "kind": "empty"
      },
      {
        "id": "scope_denied",
        "title": [
          "超出操作范围",
          "Outside action scope"
        ],
        "help": [
          "当前对象不在此动作的授权范围内。不会扩大到其他对象。",
          "The target is outside this action’s scope. Other targets will not be included."
        ],
        "kind": "denied"
      },
      {
        "id": "conflict",
        "title": [
          "记录版本已变化",
          "Version conflict"
        ],
        "help": [
          "其他人已修改记录。先读取最新版本，再核对差异；不会覆盖新内容。",
          "Someone changed this record. Reload the latest version and review differences before saving."
        ],
        "kind": "error"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "failed",
        "title": [
          "处理失败",
          "Processing failed"
        ],
        "help": [
          "本次处理未完成。核对失败原因与原操作记录后再决定下一步。",
          "Processing did not complete. Review the reason and original record before deciding the next step."
        ],
        "kind": "error"
      },
      {
        "id": "revoked",
        "title": [
          "权限已撤销",
          "Access revoked"
        ],
        "help": [
          "权限已变化。已阻止后续操作，请重新核对当前权限。",
          "Access changed. Further actions are blocked until current permissions are checked."
        ],
        "kind": "denied"
      },
      {
        "id": "module_closed",
        "title": [
          "模块未开通",
          "Module unavailable"
        ],
        "help": [
          "此企业尚未开通该模块或模块已关闭。已有角色不能替代模块开通。",
          "This module is not active for the organization. A role does not enable a module."
        ],
        "kind": "denied"
      },
      {
        "id": "csrf",
        "title": [
          "安全校验失效",
          "Security check expired"
        ],
        "help": [
          "请刷新安全校验并重新确认。已保留输入，没有自动重提。",
          "Refresh the security check and confirm again. Input is preserved and no request was automatically resubmitted."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "customers",
    "screen": "UI-17",
    "title": [
      "客户管理",
      "Customers"
    ],
    "group": "customers",
    "acceptance": [
      "AC09",
      "AC10"
    ],
    "audience": "member",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "empty",
        "title": [
          "暂无记录",
          "No records"
        ],
        "help": [
          "当前条件下没有记录。可调整筛选或返回上一步。",
          "No records match. Adjust filters or return to the previous step."
        ],
        "kind": "empty"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      },
      {
        "id": "revoked",
        "title": [
          "权限已撤销",
          "Access revoked"
        ],
        "help": [
          "权限已变化。已阻止后续操作，请重新核对当前权限。",
          "Access changed. Further actions are blocked until current permissions are checked."
        ],
        "kind": "denied"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "customer",
    "screen": "UI-18",
    "title": [
      "客户详情",
      "Customer detail"
    ],
    "group": "customers",
    "acceptance": [
      "AC09",
      "AC10"
    ],
    "audience": "member",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "not_found",
        "title": [
          "记录不可访问",
          "Record unavailable"
        ],
        "help": [
          "未找到可访问的记录。不能据此判断其他企业是否存在该对象。",
          "No accessible record was found. This does not disclose records in other organizations."
        ],
        "kind": "empty"
      },
      {
        "id": "scope_denied",
        "title": [
          "超出操作范围",
          "Outside action scope"
        ],
        "help": [
          "当前对象不在此动作的授权范围内。不会扩大到其他对象。",
          "The target is outside this action’s scope. Other targets will not be included."
        ],
        "kind": "denied"
      },
      {
        "id": "owner_changed",
        "title": [
          "负责关系已变化",
          "Assignment changed"
        ],
        "help": [
          "提交前负责关系发生变化，请重新核对当前范围。不会沿用旧的修改权限。",
          "Assignment changed before submission. Check current scope; old write access is not reused."
        ],
        "kind": "denied"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "customer-edit",
    "screen": "UI-19",
    "title": [
      "修改客户",
      "Edit customer"
    ],
    "group": "customers",
    "acceptance": [
      "AC09",
      "AC10"
    ],
    "audience": "member",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "invalid",
        "title": [
          "输入需要修正",
          "Input needs attention"
        ],
        "help": [
          "请修正标记的内容，核对后才能继续。",
          "Correct the highlighted entries before continuing."
        ],
        "kind": "warning"
      },
      {
        "id": "scope_denied",
        "title": [
          "超出操作范围",
          "Outside action scope"
        ],
        "help": [
          "当前对象不在此动作的授权范围内。不会扩大到其他对象。",
          "The target is outside this action’s scope. Other targets will not be included."
        ],
        "kind": "denied"
      },
      {
        "id": "owner_changed",
        "title": [
          "负责关系已变化",
          "Assignment changed"
        ],
        "help": [
          "提交前负责关系发生变化，请重新核对当前范围。不会沿用旧的修改权限。",
          "Assignment changed before submission. Check current scope; old write access is not reused."
        ],
        "kind": "denied"
      },
      {
        "id": "conflict",
        "title": [
          "记录版本已变化",
          "Version conflict"
        ],
        "help": [
          "其他人已修改记录。先读取最新版本，再核对差异；不会覆盖新内容。",
          "Someone changed this record. Reload the latest version and review differences before saving."
        ],
        "kind": "error"
      },
      {
        "id": "revoked",
        "title": [
          "权限已撤销",
          "Access revoked"
        ],
        "help": [
          "权限已变化。已阻止后续操作，请重新核对当前权限。",
          "Access changed. Further actions are blocked until current permissions are checked."
        ],
        "kind": "denied"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "csrf",
        "title": [
          "安全校验失效",
          "Security check expired"
        ],
        "help": [
          "请刷新安全校验并重新确认。已保留输入，没有自动重提。",
          "Refresh the security check and confirm again. Input is preserved and no request was automatically resubmitted."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "batch",
    "screen": "UI-20",
    "title": [
      "批量调整客户",
      "Batch update"
    ],
    "group": "customers",
    "acceptance": [
      "AC09",
      "AC10"
    ],
    "audience": "member",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "invalid",
        "title": [
          "输入需要修正",
          "Input needs attention"
        ],
        "help": [
          "请修正标记的内容，核对后才能继续。",
          "Correct the highlighted entries before continuing."
        ],
        "kind": "warning"
      },
      {
        "id": "ambiguous",
        "title": [
          "需要消歧",
          "Resolve ambiguous matches"
        ],
        "help": [
          "存在同名或不明确的匹配。请选择精确记录或排除该项。",
          "Some matches are ambiguous. Choose an exact record or exclude the item."
        ],
        "kind": "warning"
      },
      {
        "id": "scope_denied",
        "title": [
          "超出操作范围",
          "Outside action scope"
        ],
        "help": [
          "当前对象不在此动作的授权范围内。不会扩大到其他对象。",
          "The target is outside this action’s scope. Other targets will not be included."
        ],
        "kind": "denied"
      },
      {
        "id": "partial",
        "title": [
          "部分完成",
          "Partially completed"
        ],
        "help": [
          "逐项核对结果；已完成项不再提交，未知项先查询，明确失败项再处理。",
          "Review each result. Keep completed items, query unknown items, and handle confirmed failures separately."
        ],
        "kind": "warning"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "owner_changed",
        "title": [
          "负责关系已变化",
          "Assignment changed"
        ],
        "help": [
          "提交前负责关系发生变化，请重新核对当前范围。不会沿用旧的修改权限。",
          "Assignment changed before submission. Check current scope; old write access is not reused."
        ],
        "kind": "denied"
      },
      {
        "id": "revoked",
        "title": [
          "权限已撤销",
          "Access revoked"
        ],
        "help": [
          "权限已变化。已阻止后续操作，请重新核对当前权限。",
          "Access changed. Further actions are blocked until current permissions are checked."
        ],
        "kind": "denied"
      }
    ]
  },
  {
    "id": "export",
    "screen": "UI-21",
    "title": [
      "导出客户",
      "Export customers"
    ],
    "group": "customers",
    "acceptance": [
      "AC09",
      "AC10"
    ],
    "audience": "member",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "empty",
        "title": [
          "暂无记录",
          "No records"
        ],
        "help": [
          "当前条件下没有记录。可调整筛选或返回上一步。",
          "No records match. Adjust filters or return to the previous step."
        ],
        "kind": "empty"
      },
      {
        "id": "scope_denied",
        "title": [
          "超出操作范围",
          "Outside action scope"
        ],
        "help": [
          "当前对象不在此动作的授权范围内。不会扩大到其他对象。",
          "The target is outside this action’s scope. Other targets will not be included."
        ],
        "kind": "denied"
      },
      {
        "id": "partial",
        "title": [
          "部分完成",
          "Partially completed"
        ],
        "help": [
          "逐项核对结果；已完成项不再提交，未知项先查询，明确失败项再处理。",
          "Review each result. Keep completed items, query unknown items, and handle confirmed failures separately."
        ],
        "kind": "warning"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "revoked",
        "title": [
          "权限已撤销",
          "Access revoked"
        ],
        "help": [
          "权限已变化。已阻止后续操作，请重新核对当前权限。",
          "Access changed. Further actions are blocked until current permissions are checked."
        ],
        "kind": "denied"
      },
      {
        "id": "expired",
        "title": [
          "已过期",
          "Expired"
        ],
        "help": [
          "此记录已过有效期。请重新核对资格或申请新的有效记录。",
          "This record has expired. Review eligibility or request a new valid record."
        ],
        "kind": "error"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "tasks",
    "screen": "UI-22",
    "title": [
      "操作记录",
      "Activity and results"
    ],
    "group": "operations",
    "acceptance": [
      "AC08",
      "AC11",
      "AC12"
    ],
    "audience": "member",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "empty",
        "title": [
          "暂无记录",
          "No records"
        ],
        "help": [
          "当前条件下没有记录。可调整筛选或返回上一步。",
          "No records match. Adjust filters or return to the previous step."
        ],
        "kind": "empty"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "task",
    "screen": "UI-23",
    "title": [
      "操作详情与恢复",
      "Activity detail and recovery"
    ],
    "group": "operations",
    "acceptance": [
      "AC08",
      "AC11",
      "AC12"
    ],
    "audience": "member",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "pending",
        "title": [
          "处理中",
          "Processing"
        ],
        "help": [
          "操作已经受理，正在处理。可离开页面，稍后从原操作记录继续查看。",
          "The action was accepted and is processing. Return to its original record later."
        ],
        "kind": "warning"
      },
      {
        "id": "partial",
        "title": [
          "部分完成",
          "Partially completed"
        ],
        "help": [
          "逐项核对结果；已完成项不再提交，未知项先查询，明确失败项再处理。",
          "Review each result. Keep completed items, query unknown items, and handle confirmed failures separately."
        ],
        "kind": "warning"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "failed",
        "title": [
          "处理失败",
          "Processing failed"
        ],
        "help": [
          "本次处理未完成。核对失败原因与原操作记录后再决定下一步。",
          "Processing did not complete. Review the reason and original record before deciding the next step."
        ],
        "kind": "error"
      },
      {
        "id": "not_found",
        "title": [
          "记录不可访问",
          "Record unavailable"
        ],
        "help": [
          "未找到可访问的记录。不能据此判断其他企业是否存在该对象。",
          "No accessible record was found. This does not disclose records in other organizations."
        ],
        "kind": "empty"
      },
      {
        "id": "revoked",
        "title": [
          "权限已撤销",
          "Access revoked"
        ],
        "help": [
          "权限已变化。已阻止后续操作，请重新核对当前权限。",
          "Access changed. Further actions are blocked until current permissions are checked."
        ],
        "kind": "denied"
      },
      {
        "id": "conflict",
        "title": [
          "记录版本已变化",
          "Version conflict"
        ],
        "help": [
          "其他人已修改记录。先读取最新版本，再核对差异；不会覆盖新内容。",
          "Someone changed this record. Reload the latest version and review differences before saving."
        ],
        "kind": "error"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "delivery",
    "screen": "UI-24",
    "title": [
      "后台处理",
      "Background processing"
    ],
    "group": "operations",
    "acceptance": [
      "AC12"
    ],
    "audience": "ops",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "pending",
        "title": [
          "处理中",
          "Processing"
        ],
        "help": [
          "操作已经受理，正在处理。可离开页面，稍后从原操作记录继续查看。",
          "The action was accepted and is processing. Return to its original record later."
        ],
        "kind": "warning"
      },
      {
        "id": "retrying",
        "title": [
          "等待重试",
          "Awaiting retry"
        ],
        "help": [
          "后台处理按受控规则重试。业务结果仍需按原操作记录确认。",
          "Background work retries under controlled rules. Confirm business effects from the original activity."
        ],
        "kind": "warning"
      },
      {
        "id": "deadletter",
        "title": [
          "需要人工处理",
          "Operator attention required"
        ],
        "help": [
          "处理已暂停。先核对业务效果和关联记录，再由获准人员处理。",
          "Processing is paused. Authorized operators must check business effects and related records first."
        ],
        "kind": "error"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "diagnostics",
    "screen": "UI-25",
    "title": [
      "问题诊断",
      "Diagnostics"
    ],
    "group": "observability",
    "acceptance": [
      "AC13",
      "AC14"
    ],
    "audience": "support",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "no_sample",
        "title": [
          "没有采样记录",
          "No sampled record"
        ],
        "help": [
          "未找到采样记录不代表业务没有执行。请查询业务结果或关联日志。",
          "A missing sample does not mean the action did not run. Check its outcome or related logs."
        ],
        "kind": "warning"
      },
      {
        "id": "partial",
        "title": [
          "部分完成",
          "Partially completed"
        ],
        "help": [
          "逐项核对结果；已完成项不再提交，未知项先查询，明确失败项再处理。",
          "Review each result. Keep completed items, query unknown items, and handle confirmed failures separately."
        ],
        "kind": "warning"
      },
      {
        "id": "not_found",
        "title": [
          "记录不可访问",
          "Record unavailable"
        ],
        "help": [
          "未找到可访问的记录。不能据此判断其他企业是否存在该对象。",
          "No accessible record was found. This does not disclose records in other organizations."
        ],
        "kind": "empty"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      },
      {
        "id": "unavailable",
        "title": [
          "采集服务不可用",
          "Collection unavailable"
        ],
        "help": [
          "当前采集服务不可用。业务授权规则不变，终端日志继续输出。",
          "Collection is unavailable. Authorization remains enforced and terminal logging continues."
        ],
        "kind": "error"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "audit",
    "screen": "UI-26",
    "title": [
      "审计记录",
      "Audit records"
    ],
    "group": "observability",
    "acceptance": [
      "AC13",
      "AC15"
    ],
    "audience": "delegated_admin",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "loading",
        "title": [
          "正在加载",
          "Loading"
        ],
        "help": [
          "正在读取当前企业记录，请稍候。",
          "Loading records for the current organization."
        ],
        "kind": "loading"
      },
      {
        "id": "empty",
        "title": [
          "暂无记录",
          "No records"
        ],
        "help": [
          "当前条件下没有记录。可调整筛选或返回上一步。",
          "No records match. Adjust filters or return to the previous step."
        ],
        "kind": "empty"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      },
      {
        "id": "partial",
        "title": [
          "部分完成",
          "Partially completed"
        ],
        "help": [
          "逐项核对结果；已完成项不再提交，未知项先查询，明确失败项再处理。",
          "Review each result. Keep completed items, query unknown items, and handle confirmed failures separately."
        ],
        "kind": "warning"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "telemetry",
    "screen": "UI-27",
    "title": [
      "观测与采集",
      "Observability"
    ],
    "group": "observability",
    "acceptance": [
      "AC14"
    ],
    "audience": "ops",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "disabled",
        "title": [
          "未启用远端采集",
          "Remote collection disabled"
        ],
        "help": [
          "远端采集是可选项。终端日志与可用的本地查询继续工作。",
          "Remote collection is optional. Terminal logs and available local queries continue."
        ],
        "kind": "ready"
      },
      {
        "id": "unavailable",
        "title": [
          "采集服务不可用",
          "Collection unavailable"
        ],
        "help": [
          "当前采集服务不可用。业务授权规则不变，终端日志继续输出。",
          "Collection is unavailable. Authorization remains enforced and terminal logging continues."
        ],
        "kind": "error"
      },
      {
        "id": "rate_limited",
        "title": [
          "采集限流",
          "Collection rate limited"
        ],
        "help": [
          "有限队列和有界重试已启用；显示丢弃情况，不阻塞业务请求。",
          "Queues and retries are bounded. Drops are reported without blocking business requests."
        ],
        "kind": "warning"
      },
      {
        "id": "expired",
        "title": [
          "已过期",
          "Expired"
        ],
        "help": [
          "此记录已过有效期。请重新核对资格或申请新的有效记录。",
          "This record has expired. Review eligibility or request a new valid record."
        ],
        "kind": "error"
      },
      {
        "id": "partial",
        "title": [
          "部分完成",
          "Partially completed"
        ],
        "help": [
          "逐项核对结果；已完成项不再提交，未知项先查询，明确失败项再处理。",
          "Review each result. Keep completed items, query unknown items, and handle confirmed failures separately."
        ],
        "kind": "warning"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      }
    ]
  },
  {
    "id": "errors",
    "screen": "UI-28",
    "title": [
      "错误与恢复入口",
      "Errors and recovery"
    ],
    "group": "observability",
    "acceptance": [
      "AC13"
    ],
    "audience": "public",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "unauthenticated",
        "title": [
          "请重新登录",
          "Sign in again"
        ],
        "help": [
          "登录状态已失效。重新登录后核对当前企业，再查询原操作结果。",
          "Your session expired. Sign in, check the organization, and query the original outcome."
        ],
        "kind": "denied"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      },
      {
        "id": "not_found",
        "title": [
          "记录不可访问",
          "Record unavailable"
        ],
        "help": [
          "未找到可访问的记录。不能据此判断其他企业是否存在该对象。",
          "No accessible record was found. This does not disclose records in other organizations."
        ],
        "kind": "empty"
      },
      {
        "id": "server_error",
        "title": [
          "暂时无法完成",
          "Temporarily unable to complete"
        ],
        "help": [
          "已保留安全排障编号。写操作请先查询原结果，避免重复提交。",
          "Keep the support reference. For writes, check the original outcome before resubmitting."
        ],
        "kind": "error"
      },
      {
        "id": "timeout",
        "title": [
          "请求超时",
          "Request timed out"
        ],
        "help": [
          "超时不等于失败。写操作先查询原结果，只读查询可重新发起。",
          "A timeout does not prove failure. Check writes against the original record; reads can be retried."
        ],
        "kind": "warning"
      },
      {
        "id": "cancelled",
        "title": [
          "已取消等待",
          "Waiting cancelled"
        ],
        "help": [
          "取消等待不会撤销已经提交的操作。请从操作记录核对结果。",
          "Stopping the wait does not undo a submitted action. Check the activity record for its outcome."
        ],
        "kind": "warning"
      },
      {
        "id": "offline",
        "title": [
          "网络中断",
          "Offline"
        ],
        "help": [
          "连接已中断。保留当前输入；恢复连接后先查询原操作结果。",
          "Connection lost. Keep your input and check the original outcome after reconnecting."
        ],
        "kind": "error"
      },
      {
        "id": "client_error",
        "title": [
          "页面出现问题",
          "Page problem"
        ],
        "help": [
          "当前页面未能继续。可复制排障编号并返回安全入口，未提交内容不会自动执行。",
          "The page could not continue. Copy the support reference and return safely; unsent input is not executed."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "qualification",
    "screen": "UI-29",
    "title": [
      "环境资格",
      "Environment qualification"
    ],
    "group": "release",
    "acceptance": [
      "AC14",
      "AC15"
    ],
    "audience": "ops",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "pending",
        "title": [
          "处理中",
          "Processing"
        ],
        "help": [
          "操作已经受理，正在处理。可离开页面，稍后从原操作记录继续查看。",
          "The action was accepted and is processing. Return to its original record later."
        ],
        "kind": "warning"
      },
      {
        "id": "failed",
        "title": [
          "处理失败",
          "Processing failed"
        ],
        "help": [
          "本次处理未完成。核对失败原因与原操作记录后再决定下一步。",
          "Processing did not complete. Review the reason and original record before deciding the next step."
        ],
        "kind": "error"
      },
      {
        "id": "partial",
        "title": [
          "部分完成",
          "Partially completed"
        ],
        "help": [
          "逐项核对结果；已完成项不再提交，未知项先查询，明确失败项再处理。",
          "Review each result. Keep completed items, query unknown items, and handle confirmed failures separately."
        ],
        "kind": "warning"
      },
      {
        "id": "unavailable",
        "title": [
          "采集服务不可用",
          "Collection unavailable"
        ],
        "help": [
          "当前采集服务不可用。业务授权规则不变，终端日志继续输出。",
          "Collection is unavailable. Authorization remains enforced and terminal logging continues."
        ],
        "kind": "error"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      }
    ]
  },
  {
    "id": "release",
    "screen": "UI-30",
    "title": [
      "发布计划",
      "Release plan"
    ],
    "group": "release",
    "acceptance": [
      "AC15"
    ],
    "audience": "ops",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "invalid",
        "title": [
          "输入需要修正",
          "Input needs attention"
        ],
        "help": [
          "请修正标记的内容，核对后才能继续。",
          "Correct the highlighted entries before continuing."
        ],
        "kind": "warning"
      },
      {
        "id": "missing_authority",
        "title": [
          "缺少目标环境授权",
          "Target authorization missing"
        ],
        "help": [
          "目标环境和执行人尚未获准，不能提交发布或回滚。",
          "The target and operator are not authorized. Release and rollback submission are blocked."
        ],
        "kind": "denied"
      },
      {
        "id": "missing_evidence",
        "title": [
          "资格材料不完整",
          "Qualification incomplete"
        ],
        "help": [
          "固定版本、迁移与恢复、安全及容量材料不完整，不能进入下一阶段。",
          "Version, migration, recovery, security, or capacity evidence is incomplete. Advancement is blocked."
        ],
        "kind": "denied"
      },
      {
        "id": "conflict",
        "title": [
          "记录版本已变化",
          "Version conflict"
        ],
        "help": [
          "其他人已修改记录。先读取最新版本，再核对差异；不会覆盖新内容。",
          "Someone changed this record. Reload the latest version and review differences before saving."
        ],
        "kind": "error"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "failed",
        "title": [
          "处理失败",
          "Processing failed"
        ],
        "help": [
          "本次处理未完成。核对失败原因与原操作记录后再决定下一步。",
          "Processing did not complete. Review the reason and original record before deciding the next step."
        ],
        "kind": "error"
      }
    ]
  },
  {
    "id": "rollout",
    "screen": "UI-31",
    "title": [
      "发布进度",
      "Rollout progress"
    ],
    "group": "release",
    "acceptance": [
      "AC15"
    ],
    "audience": "ops",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "pending",
        "title": [
          "处理中",
          "Processing"
        ],
        "help": [
          "操作已经受理，正在处理。可离开页面，稍后从原操作记录继续查看。",
          "The action was accepted and is processing. Return to its original record later."
        ],
        "kind": "warning"
      },
      {
        "id": "partial",
        "title": [
          "部分完成",
          "Partially completed"
        ],
        "help": [
          "逐项核对结果；已完成项不再提交，未知项先查询，明确失败项再处理。",
          "Review each result. Keep completed items, query unknown items, and handle confirmed failures separately."
        ],
        "kind": "warning"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "failed",
        "title": [
          "处理失败",
          "Processing failed"
        ],
        "help": [
          "本次处理未完成。核对失败原因与原操作记录后再决定下一步。",
          "Processing did not complete. Review the reason and original record before deciding the next step."
        ],
        "kind": "error"
      },
      {
        "id": "paused",
        "title": [
          "已暂停推进",
          "Rollout paused"
        ],
        "help": [
          "当前阶段已暂停，保留已生效范围。先核对观测和当前状态，再决定继续或恢复。",
          "Rollout is paused with its applied scope retained. Check observations and current state before continuing or recovering."
        ],
        "kind": "warning"
      },
      {
        "id": "forbidden",
        "title": [
          "没有访问权限",
          "Access denied"
        ],
        "help": [
          "当前身份无权访问。请联系企业负责人核对权限，不会执行操作。",
          "Your current identity cannot access this area. Ask an owner to review access. No action was performed."
        ],
        "kind": "denied"
      }
    ]
  },
  {
    "id": "recovery",
    "screen": "UI-32",
    "title": [
      "恢复与回滚",
      "Recovery and rollback"
    ],
    "group": "release",
    "acceptance": [
      "AC15"
    ],
    "audience": "ops",
    "scenarios": [
      {
        "id": "normal",
        "title": [
          "正常流程",
          "Normal flow"
        ],
        "help": [
          "核对对象和范围后操作。",
          "Review the target and scope before acting."
        ],
        "kind": "ready"
      },
      {
        "id": "invalid",
        "title": [
          "输入需要修正",
          "Input needs attention"
        ],
        "help": [
          "请修正标记的内容，核对后才能继续。",
          "Correct the highlighted entries before continuing."
        ],
        "kind": "warning"
      },
      {
        "id": "missing_authority",
        "title": [
          "缺少目标环境授权",
          "Target authorization missing"
        ],
        "help": [
          "目标环境和执行人尚未获准，不能提交发布或回滚。",
          "The target and operator are not authorized. Release and rollback submission are blocked."
        ],
        "kind": "denied"
      },
      {
        "id": "missing_evidence",
        "title": [
          "资格材料不完整",
          "Qualification incomplete"
        ],
        "help": [
          "固定版本、迁移与恢复、安全及容量材料不完整，不能进入下一阶段。",
          "Version, migration, recovery, security, or capacity evidence is incomplete. Advancement is blocked."
        ],
        "kind": "denied"
      },
      {
        "id": "unknown",
        "title": [
          "结果待确认",
          "Outcome unknown"
        ],
        "help": [
          "请求可能已受理。保留操作编号并查询原记录，暂不重复提交。",
          "The request may have been accepted. Keep its reference and check the original record before resubmitting."
        ],
        "kind": "warning"
      },
      {
        "id": "failed",
        "title": [
          "处理失败",
          "Processing failed"
        ],
        "help": [
          "本次处理未完成。核对失败原因与原操作记录后再决定下一步。",
          "Processing did not complete. Review the reason and original record before deciding the next step."
        ],
        "kind": "error"
      },
      {
        "id": "conflict",
        "title": [
          "记录版本已变化",
          "Version conflict"
        ],
        "help": [
          "其他人已修改记录。先读取最新版本，再核对差异；不会覆盖新内容。",
          "Someone changed this record. Reload the latest version and review differences before saving."
        ],
        "kind": "error"
      }
    ]
  }
] as const;
export type ReviewPageId = typeof reviewPages[number]['id'];
export type ReviewScenario = typeof reviewPages[number]['scenarios'][number];
export type ReviewRole = 'manager' | 'owner' | 'operator' | 'reader' | 'platform' | 'support' | 'ops';
export const reviewBase = '/__design/f-series/full';
